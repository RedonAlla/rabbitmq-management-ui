import { fmtInt } from "@/lib/format"

export type PropertyEntry = [string, unknown]

function textValue(
  value: unknown,
  formatNumber: (value: number) => string
): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return formatNumber(value)
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

export function propertyText(value: unknown): string {
  return textValue(value, fmtInt)
}

export function argumentText(value: unknown): string {
  return textValue(value, String)
}

export function flattenProperties(
  record: Record<string, unknown>,
  prefix = ""
): PropertyEntry[] {
  return Object.entries(record).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenProperties(value as Record<string, unknown>, label)
    }
    return [[label, value] as PropertyEntry]
  })
}
