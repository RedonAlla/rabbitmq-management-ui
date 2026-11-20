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
import VhostSelect from "@/components/ui/vhost-select"
import type { Policy } from "@/data/types"
import {
  jsonValueToRow,
  parseArgumentsJson,
  parseJsonToRows,
  parsePairText,
  rowsToJsonText,
  rowsToPairText,
  type ArgumentMode,
  type ArgumentRow,
  type ArgumentValue,
} from "@/lib/arguments"
import { useCluster } from "@/store/cluster"
import PolicyDefinitionEditor from "./policy-definition-editor"
import {
  OPERATOR_POLICY_SETTING_PRESETS,
  POLICY_SETTING_PRESETS,
} from "./policy-setting-presets"

const POLICY_APPLY_TO = ["queues", "exchanges", "all"] as const

function definitionToRows(
  definition: Policy["definition"],
  nextId: () => number
): ArgumentRow[] {
  const rows: ArgumentRow[] = []
  for (const [key, value] of Object.entries(definition)) {
    const row = jsonValueToRow(value)
    if (row) rows.push({ id: nextId(), key, ...row })
  }
  return rows
}

export default function AddPolicyDrawer({
  open,
  onClose,
  operator = false,
  policy = null,
}: {
  open: boolean
  onClose: () => void
  operator?: boolean
  policy?: Policy | null
}) {
  const { data, actions } = useCluster()
  const isEdit = policy !== null
  const existing = operator ? data.operatorPolicies : data.policies
  const presets = operator
    ? OPERATOR_POLICY_SETTING_PRESETS
    : POLICY_SETTING_PRESETS
  const nextDefinitionId = useRef(0)
  const [name, setName] = useState(policy?.name ?? "")
  const [vhost, setVhost] = useState(policy?.vhost ?? "/")
  const [pattern, setPattern] = useState(policy?.pattern ?? "^orders\\.")
  const [applyTo, setApplyTo] = useState<"queues" | "exchanges" | "all">(
    POLICY_APPLY_TO.find((value) => value === policy?.applyTo) ?? "queues"
  )
  const [priority, setPriority] = useState(
    policy ? String(policy.priority) : operator ? "10" : "1"
  )
  const [definitionRows, setDefinitionRows] = useState<ArgumentRow[]>(() =>
    policy
      ? definitionToRows(
          policy.definition,
          () => (nextDefinitionId.current += 1)
        )
      : [{ id: 0, key: "max-length", type: "number", value: "50000" }]
  )
  const [definitionMode, setDefinitionMode] = useState<ArgumentMode>("inputs")
  const [definitionPairs, setDefinitionPairs] = useState("")
  const [definitionJson, setDefinitionJson] = useState("")
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [presetSelection, setPresetSelection] = useState<string[]>([])
  const [error, setError] = useState("")

  const addDefinitionRow = () => {
    const id = (nextDefinitionId.current += 1)
    setDefinitionRows((rows) => [
      ...rows,
      { id, key: "", type: "string", value: "" },
    ])
    setError("")
  }

  const updateDefinitionRow = (
    id: number,
    patch: Partial<Omit<ArgumentRow, "id">>
  ) => {
    setDefinitionRows((rows) =>
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

  const removeDefinitionRow = (id: number) => {
    setDefinitionRows((rows) => rows.filter((row) => row.id !== id))
    setError("")
  }

  const togglePreset = (id: string, checked: boolean) => {
    setPresetSelection((selected) =>
      checked ? [...selected, id] : selected.filter((item) => item !== id)
    )
  }

  const applyPresets = () => {
    const selected = presets.filter((preset) =>
      presetSelection.includes(preset.id)
    )
    if (selected.length === 0) return
    const nextId = () => (nextDefinitionId.current += 1)
    const base =
      definitionMode === "json"
        ? parseJsonToRows(definitionJson, nextId)
        : definitionMode === "pairs"
          ? parsePairText(definitionPairs, nextId)
          : definitionRows
    const seen = new Set(
      base.map((row) => row.key.trim()).filter((key) => key.length > 0)
    )
    const added: ArgumentRow[] = []
    for (const preset of selected) {
      for (const arg of preset.args) {
        if (seen.has(arg.key)) continue
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
    setDefinitionRows(rows)
    if (definitionMode === "json") setDefinitionJson(rowsToJsonText(rows))
    if (definitionMode === "pairs") setDefinitionPairs(rowsToPairText(rows))
    setPresetSelection([])
    setPresetsOpen(false)
    setError("")
  }

  const changeDefinitionMode = (mode: ArgumentMode) => {
    if (mode === definitionMode) return
    const nextId = () => (nextDefinitionId.current += 1)
    const baseRows =
      definitionMode === "pairs"
        ? parsePairText(definitionPairs, nextId)
        : definitionMode === "json"
          ? parseJsonToRows(definitionJson, nextId)
          : definitionRows
    if (mode === "pairs") {
      setDefinitionPairs(rowsToPairText(baseRows))
    } else if (mode === "json") {
      setDefinitionJson(rowsToJsonText(baseRows))
    } else {
      setDefinitionRows(baseRows)
    }
    setError("")
    setDefinitionMode(mode)
  }

  const collectDefinition = (): Record<string, ArgumentValue> | null => {
    if (definitionMode === "json") {
      const parsed = parseArgumentsJson(definitionJson, [], "Definition")
      if (parsed.error) {
        setError(parsed.error)
        return null
      }
      return parsed.args
    }
    let rows = definitionRows
    if (definitionMode === "pairs") {
      const invalidLine = definitionPairs
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0 && line.indexOf(":") <= 0)
      if (invalidLine !== undefined) {
        setError("Use one key:value pair per line.")
        return null
      }
      rows = parsePairText(
        definitionPairs,
        () => (nextDefinitionId.current += 1)
      )
    }
    const definition: Record<string, ArgumentValue> = {}
    for (const row of rows) {
      const key = row.key.trim()
      if (!key) {
        if (row.value.trim()) {
          setError("Add a key for every definition value.")
          return null
        }
        continue
      }
      if (key in definition) {
        setError(`Definition ${key} is defined more than once.`)
        return null
      }
      switch (row.type) {
        case "number": {
          const value = row.value.trim()
          if (value === "" || !Number.isFinite(Number(value))) {
            setError(`Definition ${key} must be a number.`)
            return null
          }
          definition[key] = Number(value)
          break
        }
        case "boolean":
          definition[key] = row.value === "true"
          break
        case "list":
          definition[key] = row.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
          break
        default:
          definition[key] = row.value
      }
    }
    if (!Object.keys(definition).length) {
      setError("Add at least one definition.")
      return null
    }
    return definition
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter a policy name.")
    const conflict = existing.some(
      (entry) =>
        entry.name === clean &&
        entry.vhost === vhost &&
        !(policy && entry.name === policy.name && entry.vhost === policy.vhost)
    )
    if (conflict) {
      return setError(`A policy named ${clean} already exists on ${vhost}.`)
    }
    const definition = collectDefinition()
    if (!definition) return
    const nextPolicy = {
      name: clean,
      vhost,
      pattern: pattern.trim() || ".*",
      applyTo,
      priority: Number(priority) || 0,
      definition,
    }
    try {
      await actions.savePolicy(nextPolicy, operator)
      toast.success(
        isEdit
          ? operator
            ? "Operator policy updated"
            : "Policy updated"
          : operator
            ? "Operator policy created"
            : "Policy created",
        {
          description: `${clean} applies to ${applyTo} on ${vhost}.`,
        }
      )
      setName("")
      setPresetSelection([])
      setPresetsOpen(false)
      setError("")
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
        className="data-[side=right]:w-full sm:data-[side=right]:w-[40vw] sm:max-w-xl"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>
              {isEdit
                ? operator
                  ? "Edit operator policy"
                  : "Edit policy"
                : operator
                  ? "Add operator policy"
                  : "Add policy"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update the pattern, priority, and settings this policy enforces."
                : operator
                  ? "Override user policies for matching queues and exchanges."
                  : "Apply limits and behaviour by name pattern."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 pb-4">
            <Field
              label="Policy name"
              htmlFor="policy-name"
              info={
                isEdit
                  ? "Name and virtual host are part of the policy identity and cannot change."
                  : undefined
              }
            >
              <Input
                id="policy-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder={operator ? "operator-max-length" : "orders-dlx"}
                disabled={isEdit}
                autoFocus={!isEdit}
              />
            </Field>
            <Field label="Virtual host">
              {isEdit ? (
                <Input value={vhost} readOnly disabled />
              ) : (
                <VhostSelect value={vhost} onChange={setVhost} />
              )}
            </Field>
            <Field label="Pattern" htmlFor="policy-pattern">
              <Input
                id="policy-pattern"
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
                className="font-mono"
              />
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-4">
              <Field label="Apply to">
                <Select
                  value={applyTo}
                  onValueChange={(next) =>
                    setApplyTo(String(next) as typeof applyTo)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queues">Queues</SelectItem>
                    <SelectItem value="exchanges">Exchanges</SelectItem>
                    <SelectItem value="all">Queues and exchanges</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority" htmlFor="policy-priority">
                <Input
                  id="policy-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
            </div>
            <PolicyDefinitionEditor
              mode={definitionMode}
              onModeChange={changeDefinitionMode}
              rows={definitionRows}
              onAddRow={addDefinitionRow}
              onUpdateRow={updateDefinitionRow}
              onRemoveRow={removeDefinitionRow}
              pairs={definitionPairs}
              onPairsChange={(value) => {
                setDefinitionPairs(value)
                setError("")
              }}
              json={definitionJson}
              onJsonChange={(value) => {
                setDefinitionJson(value)
                setError("")
              }}
              presets={presets}
              presetsOpen={presetsOpen}
              onPresetsOpenChange={setPresetsOpen}
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
            <Button type="submit">
              {isEdit
                ? "Save changes"
                : operator
                  ? "Create operator policy"
                  : "Create policy"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
