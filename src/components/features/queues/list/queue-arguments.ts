import {
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
