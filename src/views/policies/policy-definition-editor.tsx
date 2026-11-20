import { Fragment } from "react"
import {
  ArrowUpRightIcon,
  ListPlusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
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
import type { ArgumentMode, ArgumentRow, ArgumentType } from "@/lib/arguments"
import { cn } from "@/lib/utils"
import type { PolicySettingPreset } from "./policy-setting-presets"

const DEFINITION_TYPE_OPTIONS: { value: ArgumentType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "list", label: "List" },
]

const DEFINITION_VALUE_PLACEHOLDER: Record<
  Exclude<ArgumentType, "boolean">,
  string
> = {
  string: "value",
  number: "0",
  list: "a, b, c",
}

const DEFINITION_PAIRS_PLACEHOLDER =
  "max-length:50000\nha-mode:all\nqueue-mode:lazy"

const DEFINITION_JSON_PLACEHOLDER = '{\n  "max-length": 50000\n}'

const POLICY_SETTINGS_HINT =
  "RabbitMQ only accepts recognised policy settings; unknown keys are rejected."

const DEFINITION_INFO: Record<ArgumentMode, string> = {
  inputs: `Optional key/value pairs with a type. List values are comma-separated. ${POLICY_SETTINGS_HINT}`,
  pairs: `One key:value pair per line. true/false, numbers, and [a, b, c] lists are typed automatically; quote a value to keep it a string. ${POLICY_SETTINGS_HINT}`,
  json: `A JSON object of policy definitions. Values may be strings, numbers, booleans, or arrays. ${POLICY_SETTINGS_HINT}`,
}

export default function PolicyDefinitionEditor({
  mode,
  onModeChange,
  rows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  pairs,
  onPairsChange,
  json,
  onJsonChange,
  presets,
  presetsOpen,
  onPresetsOpenChange,
  presetSelection,
  onTogglePreset,
  onApplyPresets,
}: {
  mode: ArgumentMode
  onModeChange: (mode: ArgumentMode) => void
  rows: ArgumentRow[]
  onAddRow: () => void
  onUpdateRow: (id: number, patch: Partial<Omit<ArgumentRow, "id">>) => void
  onRemoveRow: (id: number) => void
  pairs: string
  onPairsChange: (value: string) => void
  json: string
  onJsonChange: (value: string) => void
  presets: PolicySettingPreset[]
  presetsOpen: boolean
  onPresetsOpenChange: (open: boolean) => void
  presetSelection: string[]
  onTogglePreset: (id: string, checked: boolean) => void
  onApplyPresets: () => void
}) {
  return (
    <Field label="Definition" info={DEFINITION_INFO[mode]}>
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
                <PopoverTitle>Policy settings</PopoverTitle>
                <PopoverDescription>
                  Select settings RabbitMQ accepts for this policy.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex flex-col gap-2">
                {presets.map((preset, index) => {
                  const selected = presetSelection.includes(preset.id)
                  return (
                    <Fragment key={preset.id}>
                      {index === 0 ||
                      presets[index - 1].group !== preset.group ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {preset.group}
                        </span>
                      ) : null}
                      <div
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
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-sm font-medium">
                              {preset.label}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {preset.args.map((arg) => arg.key).join(", ")}
                            </span>
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
                    </Fragment>
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
                aria-label="Definition key"
                placeholder="max-length"
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
                  aria-label="Definition type"
                  className="w-24 shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFINITION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {row.type === "boolean" ? (
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <Switch
                    aria-label="Definition value"
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
                  aria-label="Definition value"
                  type={row.type === "number" ? "number" : "text"}
                  step={row.type === "number" ? "any" : undefined}
                  placeholder={DEFINITION_VALUE_PLACEHOLDER[row.type]}
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
                aria-label="Remove definition"
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
            Add definition
          </Button>
        </TabsContent>
        <TabsContent value="pairs">
          <Textarea
            aria-label="Definition as key:value lines"
            placeholder={DEFINITION_PAIRS_PLACEHOLDER}
            value={pairs}
            className="font-mono"
            rows={5}
            onChange={(event) => onPairsChange(event.target.value)}
          />
        </TabsContent>
        <TabsContent value="json">
          <Textarea
            aria-label="Definition as JSON"
            placeholder={DEFINITION_JSON_PLACEHOLDER}
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
