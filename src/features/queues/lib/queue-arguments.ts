import { parsePairValue } from "@/lib/parse-value";
import type { QueueArgumentValue } from "@/lib/rabbit-api";

export type ArgumentType = "string" | "number" | "boolean" | "list";

export type ArgumentRow = {
  id: number;
  key: string;
  type: ArgumentType;
  value: string;
};

export type ArgumentMode = "inputs" | "pairs" | "json";

export type ArgumentPreset = {
  id: string;
  label: string;
  notes: string;
  doc?: { href: string; label: string };
  args: { key: string; type: ArgumentType; value: string }[];
};

function pairTextToRow(raw: string): Pick<ArgumentRow, "type" | "value"> {
  const value = parsePairValue(raw);
  if (typeof value === "boolean") {
    return { type: "boolean", value: value ? "true" : "false" };
  }
  if (typeof value === "number") {
    return { type: "number", value: String(value) };
  }
  if (Array.isArray(value)) {
    return { type: "list", value: value.map((item) => String(item)).join(", ") };
  }
  return { type: "string", value };
}

export function inferArgumentFields(
  raw: string
): Pick<ArgumentRow, "type" | "value"> {
  const inferred = pairTextToRow(raw);
  return inferred.type === "list" ? inferred : { type: inferred.type, value: raw };
}

export function rowsToArgumentObject(
  rows: ArgumentRow[]
): Record<string, QueueArgumentValue> {
  const args: Record<string, QueueArgumentValue> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    switch (row.type) {
      case "number": {
        const value = row.value.trim();
        args[key] =
          value !== "" && Number.isFinite(Number(value)) ? Number(value) : "";
        break;
      }
      case "boolean":
        args[key] = row.value === "true";
        break;
      case "list":
        args[key] = row.value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        break;
      default:
        args[key] = row.value;
    }
  }
  return args;
}

export function rowsToJsonText(rows: ArgumentRow[]): string {
  return JSON.stringify(rowsToArgumentObject(rows), null, 2);
}

function jsonValueToRow(
  value: unknown
): Pick<ArgumentRow, "type" | "value"> | null {
  if (typeof value === "boolean") {
    return { type: "boolean", value: value ? "true" : "false" };
  }
  if (typeof value === "number") {
    return { type: "number", value: String(value) };
  }
  if (typeof value === "string") {
    return { type: "string", value };
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
    return { type: "list", value: value.map((item) => String(item)).join(", ") };
  }
  return null;
}

export function parseJsonToRows(
  text: string,
  nextId: () => number
): ArgumentRow[] {
  if (!text.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return [];
    }
    const rows: ArgumentRow[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (!key || key === "x-queue-type") continue;
      const row = jsonValueToRow(value);
      if (row) rows.push({ id: nextId(), key, ...row });
    }
    return rows;
  } catch {
    return [];
  }
}

export function parseArgumentsJson(text: string): {
  args: Record<string, QueueArgumentValue>;
  error: string | null;
} {
  if (!text.trim()) return { args: {}, error: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { args: {}, error: "Arguments must be valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { args: {}, error: "Arguments must be a JSON object." };
  }
  const args: Record<string, QueueArgumentValue> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key === "x-queue-type") {
      return { args, error: "x-queue-type is set by the queue type selector." };
    }
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      args[key] = value;
      continue;
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
      args[key] = value as Array<string | number | boolean>;
      continue;
    }
    return {
      args,
      error: `Argument ${key} must be a string, number, boolean, or list.`,
    };
  }
  return { args, error: null };
}
