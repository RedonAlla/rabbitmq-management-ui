import type { QueueArgumentValue } from "@/lib/rabbit-api";

export function parsePairValue(raw: string): QueueArgumentValue {
  const text = raw.trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (text.startsWith('"') && text.endsWith('"') && text.length > 1) {
    try {
      return String(JSON.parse(text));
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean"
        )
      ) {
        return parsed as Array<string | number | boolean>;
      }
    } catch {
      // Treat unparseable arrays as plain strings.
    }
  }
  if (text !== "" && Number.isFinite(Number(text))) return Number(text);
  return text;
}
