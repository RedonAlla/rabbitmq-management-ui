import { useRef, useState, type ReactNode } from "react";
import { ChevronRightIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { QueueArgumentValue } from "@/lib/rabbit-api";
import { parsePairValue } from "@/lib/parse-value";
import { cn } from "@/lib/utils";

type KeyValueRow = { id: number; key: string; value: string };

function jsonTextToKeyValueRows(
  text: string
): Array<Omit<KeyValueRow, "id">> {
  if (!text.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return [];
  }
  return Object.entries(parsed).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function keyValueRowsToJsonText(rows: KeyValueRow[]): string {
  const object: Record<string, QueueArgumentValue> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    object[key] = parsePairValue(row.value);
  }
  return Object.keys(object).length > 0
    ? JSON.stringify(object, null, 2)
    : "";
}

export default function JsonSection({
  label,
  id,
  info,
  placeholder,
  keyPlaceholder,
  valuePlaceholder,
  itemName,
  value,
  onChange,
  open,
  onOpenChange,
}: {
  label: string;
  id: string;
  info: ReactNode;
  placeholder: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
  itemName: string;
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"pairs" | "json">("pairs");
  const [rows, setRows] = useState<KeyValueRow[]>(() =>
    jsonTextToKeyValueRows(value).map((row, index) => ({
      ...row,
      id: index + 1,
    }))
  );
  const nextRowId = useRef(rows.length + 1);

  const updateRows = (next: KeyValueRow[]) => {
    setRows(next);
    onChange(keyValueRowsToJsonText(next));
  };

  const changeMode = (next: string) => {
    if (next === mode) return;
    if (next === "json") {
      if (rows.length > 0 || !value.trim()) {
        onChange(keyValueRowsToJsonText(rows));
      }
    } else {
      setRows(
        jsonTextToKeyValueRows(value).map((row) => ({
          ...row,
          id: nextRowId.current++,
        }))
      );
    }
    setMode(next as "pairs" | "json");
    if (!open) onOpenChange(true);
  };

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
            <TabsTrigger value="pairs" className="px-1 text-xs sm:px-1.5 sm:text-sm">
              Key / value
            </TabsTrigger>
            <TabsTrigger value="json" className="px-1 text-xs sm:px-1.5 sm:text-sm">
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
                    const key = event.target.value;
                    updateRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, key } : entry
                      )
                    );
                  }}
                />
                <Input
                  aria-label={`${label} value`}
                  placeholder={valuePlaceholder}
                  value={row.value}
                  className="min-w-0 flex-1 font-mono"
                  onChange={(event) => {
                    const next = event.target.value;
                    updateRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, value: next } : entry
                      )
                    );
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
                  { id: nextRowId.current++, key: "", value: "" },
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
  );
}
