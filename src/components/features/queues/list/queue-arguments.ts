import {
  inferArgumentFields,
  parseArgumentsJson as parseArgumentsJsonBase,
  parseJsonToRows as parseJsonToRowsBase,
  type ArgumentRow,
  type ArgumentType,
  type ArgumentValue,
} from "@/lib/arguments"

export type {
  ArgumentMode,
  ArgumentRow,
  ArgumentType,
  ArgumentValue,
} from "@/lib/arguments"
export {
  inferArgumentFields,
  jsonValueToRow,
  rowsToArgumentObject,
  rowsToJsonText,
} from "@/lib/arguments"

export type ArgumentPreset = {
  id: string
  label: string
  notes: string
  doc?: { href: string; label: string }
  args: { key: string; type: ArgumentType; value: string }[]
}

const QUEUE_RESERVED_KEYS = ["x-queue-type"]

export function parseJsonToRows(
  text: string,
  nextId: () => number
): ArgumentRow[] {
  return parseJsonToRowsBase(text, nextId, QUEUE_RESERVED_KEYS)
}

export function parseArgumentsJson(text: string): {
  args: Record<string, ArgumentValue>
  error: string | null
} {
  return parseArgumentsJsonBase(text, QUEUE_RESERVED_KEYS)
}

function inferPairFields(raw: string): Pick<ArgumentRow, "type" | "value"> {
  const text = raw.trim()
  const commaList =
    !text.startsWith('"') && !text.startsWith("[") && text.includes(",")
  if (commaList) {
    const items = text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (items.length > 1) return { type: "list", value: items.join(", ") }
  }
  return inferArgumentFields(raw)
}

export function parseQueuePairText(
  text: string,
  nextId: () => number
): ArgumentRow[] {
  const rows: ArgumentRow[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(":")
    if (colon <= 0) continue
    const key = trimmed.slice(0, colon).trim()
    if (!key) continue
    rows.push({
      id: nextId(),
      key,
      ...inferPairFields(trimmed.slice(colon + 1).trim()),
    })
  }
  return rows
}

export function rowsToQueuePairText(rows: ArgumentRow[]): string {
  return rows
    .filter((row) => row.key.trim().length > 0)
    .map((row) => `${row.key.trim()}:${row.value}`)
    .join("\n")
}
