import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Field from "@/components/ui/field"
import FormError from "@/components/ui/form-error"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import ToggleField from "@/components/ui/toggle-field"
import VhostSelect from "@/components/ui/vhost-select"
import type { QueueArgumentValue, QueueDeclarationType } from "@/lib/rabbit-api"
import { cn } from "@/lib/utils"
import { useCluster } from "@/store/cluster"
import { ARGUMENT_PRESETS } from "@/views/queues/queue-argument-presets"
import QueueArgumentsEditor from "@/views/queues/queue-arguments-editor"
import {
  inferArgumentFields,
  parseArgumentsJson,
  parseJsonToRows,
  rowsToJsonText,
  type ArgumentMode,
  type ArgumentRow,
} from "@/views/queues/queue-arguments"
import { ConditionalRender } from "@/components/conditional-render"

const QUEUE_TYPE_OPTIONS: { value: QueueDeclarationType; label: string }[] = [
  { value: "default", label: "Default for virtual host" },
  { value: "classic", label: "Classic" },
  { value: "quorum", label: "Quorum" },
  { value: "stream", label: "Stream" },
]

export default function AddQueueDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}) {
  const { data, actions } = useCluster()
  const [name, setName] = useState("")
  const [vhost, setVhost] = useState("/")
  const [type, setType] = useState<QueueDeclarationType>("default")
  const [durable, setDurable] = useState(true)
  const [autoDelete, setAutoDelete] = useState(false)
  const [argumentRows, setArgumentRows] = useState<ArgumentRow[]>([])
  const [argumentMode, setArgumentMode] = useState<ArgumentMode>("inputs")
  const [argumentJson, setArgumentJson] = useState("")
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetSelection, setPresetSelection] = useState<string[]>([])
  const [error, setError] = useState("")
  const nextArgumentId = useRef(0)

  const showDurable = type === "default" || type === "classic"
  const showAutoDelete = type === "classic"

  const addArgumentRow = () => {
    const id = (nextArgumentId.current += 1)
    setArgumentRows((rows) => [
      ...rows,
      { id, key: "", type: "string", value: "" },
    ])
    setError("")
  }

  const updateArgumentRow = (
    id: number,
    patch: Partial<Omit<ArgumentRow, "id">>
  ) => {
    setArgumentRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        if (patch.type && patch.type !== row.type) {
          if (
            patch.type === "boolean" &&
            next.value !== "true" &&
            next.value !== "false"
          ) {
            next.value = "true"
          }
          if (
            patch.type === "number" &&
            next.value !== "" &&
            !Number.isFinite(Number(next.value))
          ) {
            next.value = ""
          }
        }
        return next
      })
    )
    setError("")
  }

  const updateArgumentValue = (id: number, value: string) => {
    const inferred = inferArgumentFields(value)
    setArgumentRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...inferred } : row))
    )
    setError("")
  }

  const removeArgumentRow = (id: number) => {
    setArgumentRows((rows) => rows.filter((row) => row.id !== id))
    setError("")
  }

  const changeArgumentMode = (mode: ArgumentMode) => {
    if (mode === argumentMode) return
    setError("")
    if (mode === "json") {
      setArgumentJson(rowsToJsonText(argumentRows))
    } else if (argumentMode === "json") {
      const nextId = () => (nextArgumentId.current += 1)
      setArgumentRows(parseJsonToRows(argumentJson, nextId))
    }
    setArgumentMode(mode)
  }

  const changeArgumentJson = (value: string) => {
    setArgumentJson(value)
    setError("")
  }

  const togglePreset = (id: string, checked: boolean) => {
    setPresetSelection((selected) =>
      checked ? [...selected, id] : selected.filter((item) => item !== id)
    )
  }

  const applyPresets = () => {
    const presets = ARGUMENT_PRESETS[type].filter((preset) =>
      presetSelection.includes(preset.id)
    )
    if (presets.length === 0) return
    const nextId = () => (nextArgumentId.current += 1)
    const base =
      argumentMode === "json"
        ? parseJsonToRows(argumentJson, nextId)
        : argumentRows
    const seen = new Set(
      base.map((row) => row.key.trim()).filter((key) => key.length > 0)
    )
    const added: ArgumentRow[] = []
    for (const preset of presets) {
      for (const arg of preset.args) {
        if (arg.key === "x-queue-type" || seen.has(arg.key)) continue
        seen.add(arg.key)
        added.push({
          id: nextId(),
          key: arg.key,
          type: arg.type,
          value: arg.value,
        })
      }
    }
    const rows = [...base, ...added]
    setArgumentRows(rows)
    if (argumentMode === "json") setArgumentJson(rowsToJsonText(rows))
    setPresetSelection([])
    setPresetOpen(false)
    setError("")
  }

  const reset = () => {
    setName("")
    setVhost("/")
    setType("default")
    setDurable(true)
    setAutoDelete(false)
    setArgumentRows([])
    setArgumentMode("inputs")
    setArgumentJson("")
    setPresetOpen(false)
    setPresetSelection([])
    setError("")
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter a queue name.")
    if (
      data.queues.some((queue) => queue.name === clean && queue.vhost === vhost)
    ) {
      return setError(`A queue named ${clean} already exists on ${vhost}.`)
    }
    const args: Record<string, QueueArgumentValue> = {}
    if (argumentMode === "json") {
      const parsed = parseArgumentsJson(argumentJson)
      if (parsed.error) return setError(parsed.error)
      Object.assign(args, parsed.args)
    } else {
      for (const row of argumentRows) {
        const key = row.key.trim()
        if (!key) {
          if (row.value.trim())
            return setError("Add a key for every argument value.")
          continue
        }
        if (key === "x-queue-type") {
          return setError("x-queue-type is set by the queue type selector.")
        }
        if (key in args) {
          return setError(`Argument ${key} is defined more than once.`)
        }
        switch (row.type) {
          case "number": {
            const value = row.value.trim()
            if (value === "" || !Number.isFinite(Number(value))) {
              return setError(`Argument ${key} must be a number.`)
            }
            args[key] = Number(value)
            break
          }
          case "boolean":
            args[key] = row.value === "true"
            break
          case "list":
            args[key] = row.value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
            break
          default:
            args[key] = row.value
        }
      }
    }
    try {
      await actions.addQueue({
        name: clean,
        vhost,
        type,
        durable,
        autoDelete,
        args,
      })
      toast.success("Queue created", {
        description: `${clean} declared on ${vhost}.`,
      })
      reset()
      onCreated?.()
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The management API did not respond."
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[40vw] sm:max-w-xl"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>Add queue</SheetTitle>
            <SheetDescription>
              Declare a queue on an existing virtual host.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 pb-4">
            <Field label="Queue name" htmlFor="queue-name">
              <Input
                id="queue-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder="orders.created"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Queue type">
                <Select
                  value={type}
                  onValueChange={(next) => {
                    setType(String(next) as QueueDeclarationType)
                    setPresetSelection([])
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUEUE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {showDurable || showAutoDelete ? (
              <div
                className={cn("grid gap-2", showAutoDelete && "sm:grid-cols-2")}
              >
                <ConditionalRender condition={showDurable}>
                  <ToggleField
                    label="Durable"
                    checked={durable}
                    onCheckedChange={setDurable}
                  />
                </ConditionalRender>

                <ConditionalRender condition={showAutoDelete}>
                  <ToggleField
                    label="Auto-delete"
                    checked={autoDelete}
                    onCheckedChange={setAutoDelete}
                  />
                </ConditionalRender>
              </div>
            ) : null}
            <QueueArgumentsEditor
              type={type}
              mode={argumentMode}
              onModeChange={changeArgumentMode}
              rows={argumentRows}
              onAddRow={addArgumentRow}
              onUpdateRow={updateArgumentRow}
              onUpdateValue={updateArgumentValue}
              onRemoveRow={removeArgumentRow}
              json={argumentJson}
              onJsonChange={changeArgumentJson}
              presetsOpen={presetOpen}
              onPresetsOpenChange={setPresetOpen}
              presetSelection={presetSelection}
              onTogglePreset={togglePreset}
              onApplyPresets={applyPresets}
            />
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
            <Button type="submit">Declare queue</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
