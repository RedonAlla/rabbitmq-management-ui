import { useRef, useState, type ReactNode } from "react"
import { ChevronRightIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import InfoTooltip from "@/components/ui/info-tooltip"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { QueueArgumentValue } from "@/lib/rabbit-api"
import { parsePairValue } from "@/lib/parse-value"
import { cn } from "@/lib/utils"

type KeyValueRow = {
  id: number
  key: string
  value: string
  type: PairValueType
}

export type PairValueType = "string" | "number" | "boolean" | "list"

const PAIR_TYPE_LABELS: Record<PairValueType, string> = {
  string: "String",
  number: "Number",
  boolean: "Boolean",
  list: "List",
}

function inferType(value: unknown): PairValueType {
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  if (Array.isArray(value)) return "list"
  return "string"
}

function valueToText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value)
}

function isScalar(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

function typedRowValue(row: KeyValueRow): QueueArgumentValue {
  switch (row.type) {
    case "number": {
      const number = Number(row.value)
      return row.value.trim() !== "" && Number.isFinite(number)
        ? number
        : row.value
    }
    case "boolean": {
      const text = row.value.trim().toLowerCase()
      return text === "true" ? true : text === "false" ? false : row.value
    }
    case "list": {
      try {
        const parsed: unknown = JSON.parse(row.value)
        if (Array.isArray(parsed) && parsed.every(isScalar)) {
          return parsed as Array<string | number | boolean>
        }
      } catch {
        // Keep the raw text when it is not a JSON list.
      }
      return row.value
    }
    default:
      return row.value
  }
}

function jsonTextToKeyValueRows(
  text: string,
  typed: boolean
): Array<Omit<KeyValueRow, "id">> {
  if (!text.trim()) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return []
  }
  return Object.entries(parsed).map(([key, value]) => ({
    key,
    value: valueToText(value),
    type: typed ? inferType(value) : "string",
  }))
}

function keyValueRowsToJsonText(rows: KeyValueRow[], typed: boolean): string {
  const object: Record<string, QueueArgumentValue> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    object[key] = typed ? typedRowValue(row) : parsePairValue(row.value)
  }
  return Object.keys(object).length > 0 ? JSON.stringify(object, null, 2) : ""
}

export default function JsonSection({
  label,
  id,
  info,
  placeholder,
  keyPlaceholder,
  valuePlaceholder,
  itemName,
  valueTypes = false,
  value,
  onChange,
  open,
  onOpenChange,
}: {
  label: string
  id: string
  info: ReactNode
  placeholder: string
  keyPlaceholder: string
  valuePlaceholder: string
  itemName: string
  valueTypes?: boolean
  value: string
  onChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [mode, setMode] = useState<"pairs" | "json">("pairs")
  const [rows, setRows] = useState<KeyValueRow[]>(() =>
    jsonTextToKeyValueRows(value, valueTypes).map((row, index) => ({
      ...row,
      id: index + 1,
    }))
  )
  const nextRowId = useRef(rows.length + 1)

  const updateRows = (next: KeyValueRow[]) => {
    setRows(next)
    onChange(keyValueRowsToJsonText(next, valueTypes))
  }

  const changeMode = (next: string) => {
    if (next === mode) return
    if (next === "json") {
      if (rows.length > 0 || !value.trim()) {
        onChange(keyValueRowsToJsonText(rows, valueTypes))
      }
    } else {
      setRows(
        jsonTextToKeyValueRows(value, valueTypes).map((row) => ({
          ...row,
          id: nextRowId.current++,
        }))
      )
    }
    setMode(next as "pairs" | "json")
    if (!open) onOpenChange(true)
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Tabs value={mode} onValueChange={changeMode}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                />
              }
            >
              <ChevronRightIcon
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-200",
                  open && "rotate-90"
                )}
              />
              {label}
            </CollapsibleTrigger>
            <InfoTooltip label={`About ${label.toLowerCase()}`}>
              {info}
            </InfoTooltip>
          </div>
          <TabsList className="ms-auto">
            <TabsTrigger
              value="pairs"
              className="px-1 text-xs sm:px-1.5 sm:text-sm"
            >
              Key / value
            </TabsTrigger>
            <TabsTrigger
              value="json"
              className="px-1 text-xs sm:px-1.5 sm:text-sm"
            >
              JSON
            </TabsTrigger>
          </TabsList>
        </div>
        <CollapsibleContent className="flex flex-col gap-2 pt-1">
          <TabsContent value="pairs" className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <Input
                  aria-label={`${label} key`}
                  placeholder={keyPlaceholder}
                  value={row.key}
                  className="min-w-0 flex-1 font-mono"
                  onChange={(event) => {
                    const key = event.target.value
                    updateRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, key } : entry
                      )
                    )
                  }}
                />
                {valueTypes ? (
                  <Select
                    value={row.type}
                    onValueChange={(next) => {
                      const type = String(next) as PairValueType
                      updateRows(
                        rows.map((entry) =>
                          entry.id === row.id ? { ...entry, type } : entry
                        )
                      )
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`${label} type`}
                      className="w-28 shrink-0"
                    >
                      <SelectValue>
                        {(current) =>
                          PAIR_TYPE_LABELS[String(current) as PairValueType] ??
                          String(current)
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PAIR_TYPE_LABELS) as PairValueType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {PAIR_TYPE_LABELS[type]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                ) : null}
                <Input
                  aria-label={`${label} value`}
                  placeholder={
                    valueTypes
                      ? row.type === "list"
                        ? '["a", "b"]'
                        : row.type === "boolean"
                          ? "true"
                          : row.type === "number"
                            ? "123"
                            : valuePlaceholder
                      : valuePlaceholder
                  }
                  value={row.value}
                  className="min-w-0 flex-1 font-mono"
                  onChange={(event) => {
                    const next = event.target.value
                    updateRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, value: next } : entry
                      )
                    )
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${itemName}`}
                  onClick={() =>
                    updateRows(rows.filter((entry) => entry.id !== row.id))
                  }
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                updateRows([
                  ...rows,
                  {
                    id: nextRowId.current++,
                    key: "",
                    value: "",
                    type: "string",
                  },
                ])
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add {itemName}
            </Button>
          </TabsContent>
          <TabsContent value="json">
            <Textarea
              id={id}
              aria-label={`${label} JSON`}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className="min-h-20 font-mono text-xs"
            />
          </TabsContent>
        </CollapsibleContent>
      </Tabs>
    </Collapsible>
  )
}
