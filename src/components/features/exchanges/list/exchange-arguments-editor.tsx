import {
  ArrowUpRightIcon,
  ListPlusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type {
  ArgumentMode,
  ArgumentRow,
  ArgumentType,
} from "@/lib/arguments"

export type ExchangeArgumentMode = ArgumentMode

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

const ARGUMENT_PAIRS_PLACEHOLDER =
  "alternate-exchange:dead-letter\nx-max-length:50000\nx-weights:[1, 2, 3]"

const ARGUMENT_JSON_PLACEHOLDER = '{\n  "alternate-exchange": "dead-letter"\n}'

const ARGUMENT_INFO: Record<ArgumentMode, string> = {
  inputs:
    "Optional key/value pairs with a type. List values are comma-separated.",
  pairs:
    "One key:value pair per line. true/false, numbers, and [a, b, c] lists are typed automatically; quote a value to keep it a string.",
  json: "A JSON object of exchange arguments. Values may be strings, numbers, booleans, or arrays.",
}

export default function ExchangeArgumentsEditor({
  mode,
  onModeChange,
  onAddAlternateExchange,
  presetsOpen,
  onPresetsOpenChange,
  rows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  pairs,
  onPairsChange,
  json,
  onJsonChange,
}: {
  mode: ExchangeArgumentMode
  onModeChange: (mode: ExchangeArgumentMode) => void
  onAddAlternateExchange: () => void
  presetsOpen: boolean
  onPresetsOpenChange: (open: boolean) => void
  rows: ArgumentRow[]
  onAddRow: () => void
  onUpdateRow: (id: number, patch: Partial<Omit<ArgumentRow, "id">>) => void
  onRemoveRow: (id: number) => void
  pairs: string
  onPairsChange: (value: string) => void
  json: string
  onJsonChange: (value: string) => void
}) {
  return (
    <Field label="Arguments" info={ARGUMENT_INFO[mode]}>
      <Tabs
        value={mode}
        onValueChange={(next) =>
          onModeChange(String(next) as ExchangeArgumentMode)
        }
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
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Exchange arguments</PopoverTitle>
                <PopoverDescription>
                  Add a preset argument to the declaration.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Alternate exchange</span>
                <span className="text-xs text-muted-foreground">
                  If messages to this exchange cannot otherwise be routed, send
                  them to the alternate exchange named here.
                </span>
                <a
                  href="https://www.rabbitmq.com/docs/ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1 text-xs underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  (Sets the &quot;alternate-exchange&quot; argument.)
                  <ArrowUpRightIcon
                    className="size-3"
                    aria-hidden="true"
                  />
                </a>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={onAddAlternateExchange}
              >
                Add argument
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
                placeholder="alternate-exchange"
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
        <TabsContent value="pairs">
          <Textarea
            aria-label="Arguments as key:value lines"
            placeholder={ARGUMENT_PAIRS_PLACEHOLDER}
            value={pairs}
            className="font-mono"
            rows={5}
            onChange={(event) => onPairsChange(event.target.value)}
          />
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
