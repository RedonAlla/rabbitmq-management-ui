import { parsePairValue } from "@/lib/parse-value"

export type ArgumentValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>

export type ArgumentType = "string" | "number" | "boolean" | "list"

export type ArgumentRow = {
  id: number
  key: string
  type: ArgumentType
  value: string
}

export type ArgumentMode = "inputs" | "pairs" | "json"

function pairTextToRow(raw: string): Pick<ArgumentRow, "type" | "value"> {
  const value = parsePairValue(raw)
  if (typeof value === "boolean") {
    return { type: "boolean", value: value ? "true" : "false" }
  }
  if (typeof value === "number") {
    return { type: "number", value: String(value) }
  }
  if (Array.isArray(value)) {
    return { type: "list", value: value.map((item) => String(item)).join(", ") }
  }
  return { type: "string", value }
}

export function inferArgumentFields(
  raw: string
): Pick<ArgumentRow, "type" | "value"> {
  const inferred = pairTextToRow(raw)
  return inferred.type === "list"
    ? inferred
    : { type: inferred.type, value: raw }
}

export function rowsToArgumentObject(
  rows: ArgumentRow[]
): Record<string, ArgumentValue> {
  const args: Record<string, ArgumentValue> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    switch (row.type) {
      case "number": {
        const value = row.value.trim()
        args[key] =
          value !== "" && Number.isFinite(Number(value)) ? Number(value) : ""
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

export function rowsToJsonText(rows: ArgumentRow[]): string {
  return JSON.stringify(rowsToArgumentObject(rows), null, 2)
}

export function rowsToPairText(rows: ArgumentRow[]): string {
  return rows
    .filter((row) => row.key.trim().length > 0)
    .map((row) => {
      const value = row.type === "list" ? `[${row.value}]` : row.value
      return `${row.key.trim()}:${value}`
    })
    .join("\n")
}

export function parsePairText(
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
      ...inferArgumentFields(trimmed.slice(colon + 1).trim()),
    })
  }
  return rows
}

export function jsonValueToRow(
  value: unknown
): Pick<ArgumentRow, "type" | "value"> | null {
  if (typeof value === "boolean") {
    return { type: "boolean", value: value ? "true" : "false" }
  }
  if (typeof value === "number") {
    return { type: "number", value: String(value) }
  }
  if (typeof value === "string") {
    return { type: "string", value }
  }
  if (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
    )
  ) {
    return { type: "list", value: value.map((item) => String(item)).join(", ") }
  }
  return null
}

export function parseJsonToRows(
  text: string,
  nextId: () => number,
  reservedKeys: string[] = []
): ArgumentRow[] {
  if (!text.trim()) return []
  try {
    const parsed: unknown = JSON.parse(text)
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return []
    }
    const rows: ArgumentRow[] = []
    for (const [key, value] of Object.entries(parsed)) {
      if (!key || reservedKeys.includes(key)) continue
      const row = jsonValueToRow(value)
      if (row) rows.push({ id: nextId(), key, ...row })
    }
    return rows
  } catch {
    return []
  }
}

export function parseArgumentsJson(
  text: string,
  reservedKeys: string[] = []
): {
  args: Record<string, ArgumentValue>
  error: string | null
} {
  if (!text.trim()) return { args: {}, error: null }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { args: {}, error: "Arguments must be valid JSON." }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { args: {}, error: "Arguments must be a JSON object." }
  }
  const args: Record<string, ArgumentValue> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (reservedKeys.includes(key)) {
      return { args, error: `${key} is set by the queue type selector.` }
    }
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      args[key] = value
      continue
    }
    if (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      )
    ) {
      args[key] = value as Array<string | number | boolean>
      continue
    }
    return {
      args,
      error: `Argument ${key} must be a string, number, boolean, or list.`,
    }
  }
  return { args, error: null }
}
