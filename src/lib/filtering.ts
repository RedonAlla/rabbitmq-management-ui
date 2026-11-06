import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { flattenFilterConditions } from "@/components/reui/filters/filters-query";

type Accessors<T> = Record<string, (item: T) => unknown>;

function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function matchesText(value: unknown, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalize(value).toLowerCase().includes(needle.trim().toLowerCase());
}

export function filterRows<T>(items: T[], query: FilterQuery, accessors: Accessors<T>): T[] {
  const conditions = flattenFilterConditions(query);
  if (!conditions.length) return items;

  return items.filter((item) =>
    conditions.every((condition) => {
      const raw = accessors[condition.field]
        ? accessors[condition.field](item)
        : (item as Record<string, unknown>)[condition.field];
      const value = normalize(raw).toLowerCase();
      const values = condition.values.map((entry) => normalize(entry).toLowerCase());
      const first = values[0] ?? "";
      let result = true;

      switch (condition.operator) {
        case "is":
        case "equals":
          result = value === first;
          break;
        case "is_not":
        case "not_equals":
          result = value !== first;
          break;
        case "contains":
          result = value.includes(first);
          break;
        case "not_contains":
          result = !value.includes(first);
          break;
        case "starts_with":
          result = value.startsWith(first);
          break;
        case "ends_with":
          result = value.endsWith(first);
          break;
        case "is_any_of":
          result = values.includes(value);
          break;
        case "is_none_of":
          result = !values.includes(value);
          break;
        case "empty":
          result = value === "";
          break;
        case "not_empty":
          result = value !== "";
          break;
        case "greater_than":
          result = Number(raw) > Number(first);
          break;
        case "less_than":
          result = Number(raw) < Number(first);
          break;
        default:
          result = value.includes(first);
      }

      return condition.negated ? !result : result;
    })
  );
}
