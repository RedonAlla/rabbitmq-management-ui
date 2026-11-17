import { ArrowUpRightIcon, ListPlusIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Field from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { QueueDeclarationType } from "@/lib/rabbit-api"
import { cn } from "@/lib/utils"
import { ARGUMENT_PRESETS } from "@/views/queues/queue-argument-presets"
import type {
  ArgumentMode,
  ArgumentRow,
  ArgumentType,
} from "@/views/queues/queue-arguments"

const ARGUMENT_TYPE_OPTIONS: { value: ArgumentType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "list", label: "List" },
]

const ARGUMENT_VALUE_PLACEHOLDER: Record<
  Exclude<ArgumentType, "boolean">,
  string
> = {
  string: "value",
  number: "0",
  list: "a, b, c",
}

const ARGUMENT_JSON_PLACEHOLDER = '{\n  "x-max-length": 50000\n}'

export default function QueueArgumentsEditor({
  type,
  mode,
  onModeChange,
  rows,
  onAddRow,
  onUpdateRow,
  onUpdateValue,
  onRemoveRow,
  json,
  onJsonChange,
  presetsOpen,
  onPresetsOpenChange,
  presetSelection,
  onTogglePreset,
  onApplyPresets,
}: {
  type: QueueDeclarationType
  mode: ArgumentMode
  onModeChange: (mode: ArgumentMode) => void
  rows: ArgumentRow[]
  onAddRow: () => void
  onUpdateRow: (id: number, patch: Partial<Omit<ArgumentRow, "id">>) => void
  onUpdateValue: (id: number, value: string) => void
  onRemoveRow: (id: number) => void
  json: string
  onJsonChange: (value: string) => void
  presetsOpen: boolean
  onPresetsOpenChange: (open: boolean) => void
  presetSelection: string[]
  onTogglePreset: (id: string, checked: boolean) => void
  onApplyPresets: () => void
}) {
  return (
    <Field
      label="Arguments"
      info={
        mode === "pairs"
          ? "One key/value pair per row. true/false, numbers, and [JSON arrays] are typed automatically; quote a value to keep it a string."
          : mode === "json"
            ? "A JSON object of arguments. Values may be strings, numbers, booleans, or arrays; x-queue-type is added from the queue type selector."
            : type === "default"
              ? "Optional key/value pairs with a type. List values are comma-separated."
              : "Optional key/value pairs with a type. List values are comma-separated; x-queue-type is added from the queue type selector."
      }
    >
      <Tabs
        value={mode}
        onValueChange={(next) => onModeChange(String(next) as ArgumentMode)}
      >
        <div className="flex flex-wrap items-center justify-between gap-1">
          <TabsList>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="pairs">Key / value</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <Popover open={presetsOpen} onOpenChange={onPresetsOpenChange}>
            <PopoverTrigger
              render={<Button type="button" variant="outline" size="sm" />}
            >
              <ListPlusIcon data-icon="inline-start" aria-hidden="true" />
              Presets
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="max-h-(--available-height) w-80 overflow-y-auto"
            >
              <PopoverHeader>
                <PopoverTitle>
                  {type === "quorum"
                    ? "Quorum"
                    : type === "stream"
                      ? "Stream"
                      : "Classic"}{" "}
                  arguments
                </PopoverTitle>
                <PopoverDescription>
                  Select one or more to add to the arguments.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex flex-col gap-2">
                {ARGUMENT_PRESETS[type].map((preset) => {
                  const selected = presetSelection.includes(preset.id)
                  return (
                    <div
                      key={preset.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-2.5 py-1 transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent/50"
                      )}
                      onClick={(event) => {
                        if (
                          (event.target as HTMLElement).closest(
                            "[role=checkbox]"
                          )
                        ) {
                          return
                        }
                        onTogglePreset(preset.id, !selected)
                      }}
                    >
                      <Checkbox
                        aria-label={preset.label}
                        checked={selected}
                        onCheckedChange={(checked) =>
                          onTogglePreset(preset.id, checked)
                        }
                        className="mt-0.5"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {preset.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {preset.notes}
                        </span>
                        {preset.doc ? (
                          <a
                            href={preset.doc.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="flex w-fit items-center gap-1 text-xs underline underline-offset-2 transition-colors hover:text-foreground"
                          >
                            {preset.doc.label}
                            <ArrowUpRightIcon
                              className="size-3"
                              aria-hidden="true"
                            />
                          </a>
                        ) : null}
                      </span>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={presetSelection.length === 0}
                onClick={onApplyPresets}
              >
                Add selected
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <TabsContent value="inputs" className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                aria-label="Argument key"
                placeholder="x-max-length"
                value={row.key}
                className="min-w-0 flex-1 font-mono"
                onChange={(event) =>
                  onUpdateRow(row.id, { key: event.target.value })
                }
              />
              <Select
                value={row.type}
                onValueChange={(next) =>
                  onUpdateRow(row.id, {
                    type: String(next) as ArgumentType,
                  })
                }
              >
                <SelectTrigger
                  aria-label="Argument type"
                  className="w-24 shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARGUMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {row.type === "boolean" ? (
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <Switch
                    aria-label="Argument value"
                    className="shrink-0"
                    checked={row.value === "true"}
                    onCheckedChange={(checked) =>
                      onUpdateRow(row.id, {
                        value: checked ? "true" : "false",
                      })
                    }
                  />
                </div>
              ) : (
                <Input
                  aria-label="Argument value"
                  type={row.type === "number" ? "number" : "text"}
                  step={row.type === "number" ? "any" : undefined}
                  placeholder={ARGUMENT_VALUE_PLACEHOLDER[row.type]}
                  value={row.value}
                  className="min-w-0 flex-1 font-mono"
                  onChange={(event) =>
                    onUpdateRow(row.id, {
                      value: event.target.value,
                    })
                  }
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove argument"
                onClick={() => onRemoveRow(row.id)}
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
            onClick={onAddRow}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add argument
          </Button>
        </TabsContent>
        <TabsContent value="pairs" className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                aria-label="Argument key"
                placeholder="x-max-length"
                value={row.key}
                className="min-w-0 flex-1 font-mono"
                onChange={(event) =>
                  onUpdateRow(row.id, { key: event.target.value })
                }
              />
              <Input
                aria-label="Argument value"
                placeholder="value"
                value={row.value}
                className="min-w-0 flex-1 font-mono"
                onChange={(event) => onUpdateValue(row.id, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove argument"
                onClick={() => onRemoveRow(row.id)}
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
            onClick={onAddRow}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add argument
          </Button>
        </TabsContent>
        <TabsContent value="json">
          <Textarea
            aria-label="Arguments as JSON"
            placeholder={ARGUMENT_JSON_PLACEHOLDER}
            value={json}
            className="font-mono"
            rows={5}
            onChange={(event) => onJsonChange(event.target.value)}
          />
        </TabsContent>
      </Tabs>
    </Field>
  )
}
