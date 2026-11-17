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
import type { ExchangeArgumentValue, ExchangeType } from "@/data/types"
import {
  parseArgumentsJson,
  parseJsonToRows,
  parsePairText,
  rowsToJsonText,
  rowsToPairText,
  type ArgumentRow,
} from "@/lib/arguments"
import { useCluster } from "@/store/cluster"
import ExchangeArgumentsEditor, {
  type ExchangeArgumentMode,
} from "./exchange-arguments-editor"

export function AddExchangeDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const [name, setName] = useState("")
  const [vhost, setVhost] = useState("/")
  const [type, setType] = useState<ExchangeType>("topic")
  const [durable, setDurable] = useState(true)
  const [autoDelete, setAutoDelete] = useState(false)
  const [internal, setInternal] = useState(false)
  const [argumentRows, setArgumentRows] = useState<ArgumentRow[]>([])
  const [argumentMode, setArgumentMode] =
    useState<ExchangeArgumentMode>("inputs")
  const [argumentPairs, setArgumentPairs] = useState("")
  const [argumentJson, setArgumentJson] = useState("")
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [error, setError] = useState("")
  const nextArgumentId = useRef(0)

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

  const removeArgumentRow = (id: number) => {
    setArgumentRows((rows) => rows.filter((row) => row.id !== id))
    setError("")
  }

  const changeArgumentMode = (mode: ExchangeArgumentMode) => {
    if (mode === argumentMode) return
    const nextId = () => (nextArgumentId.current += 1)
    const baseRows =
      argumentMode === "pairs"
        ? parsePairText(argumentPairs, nextId)
        : argumentMode === "json"
          ? parseJsonToRows(argumentJson, nextId)
          : argumentRows
    if (mode === "pairs") {
      setArgumentPairs(rowsToPairText(baseRows))
    } else if (mode === "json") {
      setArgumentJson(rowsToJsonText(baseRows))
    } else {
      setArgumentRows(baseRows)
    }
    setError("")
    setArgumentMode(mode)
  }

  const changeArgumentPairs = (value: string) => {
    setArgumentPairs(value)
    setError("")
  }

  const addAlternateExchange = () => {
    const nextId = () => (nextArgumentId.current += 1)
    let base = argumentRows
    if (argumentMode === "pairs") {
      const invalidLine = argumentPairs
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0 && line.indexOf(":") <= 0)
      if (invalidLine !== undefined) {
        setError("Use one key:value pair per line.")
        return
      }
      base = parsePairText(argumentPairs, nextId)
    } else if (argumentMode === "json") {
      const parsed = parseArgumentsJson(argumentJson)
      if (parsed.error) {
        setError(parsed.error)
        return
      }
      base = parseJsonToRows(argumentJson, nextId)
    }
    if (base.some((row) => row.key.trim() === "alternate-exchange")) {
      setPresetsOpen(false)
      setError("")
      return
    }
    const rows: ArgumentRow[] = [
      ...base,
      { id: nextId(), key: "alternate-exchange", type: "string", value: "" },
    ]
    setArgumentRows(rows)
    if (argumentMode === "pairs") setArgumentPairs(rowsToPairText(rows))
    if (argumentMode === "json") setArgumentJson(rowsToJsonText(rows))
    setPresetsOpen(false)
    setError("")
  }

  const changeArgumentJson = (value: string) => {
    setArgumentJson(value)
    setError("")
  }

  const resetArguments = () => {
    setArgumentRows([])
    setArgumentMode("inputs")
    setArgumentPairs("")
    setArgumentJson("")
    setError("")
  }

  const collectArguments = (): Record<string, ExchangeArgumentValue> | null => {
    const args: Record<string, ExchangeArgumentValue> = {}
    if (argumentMode === "json") {
      const parsed = parseArgumentsJson(argumentJson)
      if (parsed.error) {
        setError(parsed.error)
        return null
      }
      Object.assign(args, parsed.args)
      return args
    }
    let rows = argumentRows
    if (argumentMode === "pairs") {
      const invalidLine = argumentPairs
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => {
          if (!line) return false
          return line.indexOf(":") <= 0
        })
      if (invalidLine !== undefined) {
        setError("Use one key:value pair per line.")
        return null
      }
      rows = parsePairText(argumentPairs, () => (nextArgumentId.current += 1))
    }
    for (const row of rows) {
      const key = row.key.trim()
      if (!key) {
        if (row.value.trim()) {
          setError("Add a key for every argument value.")
          return null
        }
        continue
      }
      if (key in args) {
        setError(`Argument ${key} is defined more than once.`)
        return null
      }
      switch (row.type) {
        case "number": {
          const value = row.value.trim()
          if (value === "" || !Number.isFinite(Number(value))) {
            setError(`Argument ${key} must be a number.`)
            return null
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
    return args
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter an exchange name.")
    if (
      data.exchanges.some(
        (exchange) => exchange.name === clean && exchange.vhost === vhost
      )
    ) {
      return setError(`An exchange named ${clean} already exists on ${vhost}.`)
    }
    const args = collectArguments()
    if (!args) return
    try {
      await actions.addExchange({
        name: clean,
        vhost,
        type,
        durable,
        autoDelete,
        internal,
        args,
      })
      toast.success("Exchange created", {
        description: `${clean} (${type}) on ${vhost}.`,
      })
      setName("")
      resetArguments()
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
        className="data-[side=right]:w-[40vw] data-[side=right]:sm:max-w-lg!"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>Add exchange</SheetTitle>
            <SheetDescription>
              Create a routing exchange for your topology.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 pb-4">
            <Field label="Exchange name" htmlFor="exchange-name">
              <Input
                id="exchange-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder="orders.retry"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Type">
                <Select
                  value={type}
                  onValueChange={(next) =>
                    setType(String(next) as ExchangeType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="fanout">Fanout</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="headers">Headers</SelectItem>
                    <SelectItem value="x-local-random">
                      x-local-random
                    </SelectItem>
                    <SelectItem value="x-modulus-hash">
                      x-modulus-hash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <ToggleField
                label="Durable"
                checked={durable}
                onCheckedChange={setDurable}
              />
              <ToggleField
                label="Auto-delete"
                info="If yes, the exchange will delete itself after at least one queue or exchange has been bound to this one, and then all queues or exchanges have been unbound."
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
              />
              <ToggleField
                label="Internal"
                info="If yes, clients cannot publish to this exchange directly. It can only be used with exchange to exchange bindings."
                checked={internal}
                onCheckedChange={setInternal}
              />
            </div>
            <ExchangeArgumentsEditor
              mode={argumentMode}
              onModeChange={changeArgumentMode}
              onAddAlternateExchange={addAlternateExchange}
              presetsOpen={presetsOpen}
              onPresetsOpenChange={setPresetsOpen}
              rows={argumentRows}
              onAddRow={addArgumentRow}
              onUpdateRow={updateArgumentRow}
              onRemoveRow={removeArgumentRow}
              pairs={argumentPairs}
              onPairsChange={changeArgumentPairs}
              json={argumentJson}
              onJsonChange={changeArgumentJson}
            />
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
            <Button type="submit">Declare exchange</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
