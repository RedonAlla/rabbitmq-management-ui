import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  InfoIcon,
  ListPlusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCluster } from "@/store/cluster";
import { routeTargets } from "@/lib/topology";
import type { ExchangeType } from "@/data/types";
import type {
  PublishHeaderValue,
  QueueArgumentValue,
  QueueDeclarationType,
} from "@/lib/rabbit-api";
import { cn } from "@/lib/utils";
import FormError from "../ui/form-error";
import AddUserDialog from "@/views/user/add-user-dialog";

export type DialogRequest =
  | { type: "add-queue"; onCreated?: () => void }
  | { type: "add-exchange" }
  | { type: "add-user" }
  | { type: "add-vhost" }
  | { type: "add-policy" }
  | { type: "add-operator-policy" }
  | { type: "edit-limits"; vhost?: string }
  | { type: "publish"; exchange?: string; vhost?: string }
  | { type: "shortcuts" };

interface DialogsContextValue {
  dialog: DialogRequest | null;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
}

const DialogsContext = createContext<DialogsContextValue | null>(null);

const DEFAULT_EXCHANGE = "__default__";

const QUEUE_TYPE_OPTIONS: { value: QueueDeclarationType; label: string }[] = [
  { value: "default", label: "Default for virtual host" },
  { value: "classic", label: "Classic" },
  { value: "quorum", label: "Quorum" },
  { value: "stream", label: "Stream" },
];

type ArgumentType = "string" | "number" | "boolean" | "list";

type ArgumentRow = {
  id: number;
  key: string;
  type: ArgumentType;
  value: string;
};

const ARGUMENT_TYPE_OPTIONS: { value: ArgumentType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "list", label: "List" },
];

const ARGUMENT_VALUE_PLACEHOLDER: Record<
  Exclude<ArgumentType, "boolean">,
  string
> = {
  string: "value",
  number: "0",
  list: "a, b, c",
};

type ArgumentMode = "inputs" | "pairs" | "json";

const ARGUMENT_PAIRS_PLACEHOLDER =
  "x-max-length=50000\nx-dead-letter-exchange=dlx";

const ARGUMENT_JSON_PLACEHOLDER = '{\n  "x-max-length": 50000\n}';

type ArgumentPreset = {
  id: string;
  label: string;
  notes: string;
  doc?: { href: string; label: string };
  args: { key: string; type: ArgumentType; value: string }[];
};

const CLASSIC_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "auto-expire",
    label: "Auto expire",
    notes:
      "How long a queue can be unused for before it is automatically deleted (milliseconds).",
    args: [{ key: "x-expires", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#queue-ttl",
      label: '(Sets the "x-expires" argument.)'
    }
  },
  {
    id: "message-ttl",
    label: "Message TTL",
    notes: "Per-queue message expiry (ms)",
    args: [{ key: "x-message-ttl", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#per-queue-message-ttl",
      label: '(Sets the "x-message-ttl" argument.)'
    }
  },
  {
    id: "overflow",
    label: "Overflow behaviour",
    notes: "This determines what happens to messages when the maximum length of a queue is reached. Valid values are drop-head, reject-publish or reject-publish-dlx",
    args: [{ key: "x-overflow", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: '(Sets the queue overflow behaviour.)'
    }
  },
  {
    id: "single-active-consumer",
    label: "Single active consumer",
    notes: "If set, makes sure only one consumer at a time consumes from the queue and fails over to another registered consumer in case the active one is cancelled or dies.",
    args: [{ key: "x-single-active-consumer", type: "boolean", value: "true" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/consumers#single-active-consumer",
      label: '(Sets the "x-single-active-consumer" argument.)'
    }
  },
  {
    id: "dead-letter-exchange",
    label: "Dead letter exchange",
    notes: "Optional name of an exchange to which messages will be republished if they are rejected or expire.",
    args: [{ key: "x-dead-letter-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-exchange" argument.)'
    }
  },
  {
    id: "dead-letter-routing-key",
    label: "Dead letter routing key",
    notes: "Optional replacement routing key to use when a message is dead-lettered. If this is not set, the message's original routing key will be used.",
    args: [{ key: "x-dead-letter-routing-key", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-routing-key" argument.)'
    }
  },
  {
    id: "max-length",
    label: "Max length",
    notes: "How many (ready) messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length" argument.)'
    }
  },
  {
    id: "max-length-bytes",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "max-priority",
    label: "Maximum priority",
    notes: "Maximum number of priority levels for the queue to support; if not set, the queue will not support message priorities.",
    args: [{ key: "x-max-priority", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/priority",
      label: '(Sets the "x-max-priority" argument.)'
    }
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
];

const QUORUM_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "auto-expire",
    label: "Auto expire",
    notes:
      "How long a queue can be unused for before it is automatically deleted (milliseconds).",
    args: [{ key: "x-expires", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#queue-ttl",
      label: '(Sets the "x-expires" argument.)'
    }
  },
  {
    id: "message-ttl",
    label: "Message TTL",
    notes: "How long a message published to a queue can live before it is discarded (milliseconds).",
    args: [{ key: "x-message-ttl", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#per-queue-message-ttl",
      label: '(Sets the "x-message-ttl" argument.)'
    }
  },
  {
    id: "overflow",
    label: "Overflow behaviour",
    notes: "This determines what happens to messages when the maximum length of a queue is reached. Valid values for quorum queues are drop-head and reject-publish.",
    args: [{ key: "x-overflow", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: 'Sets the queue overflow behaviour'
    }
  },
  {
    id: "single-active-consumer",
    label: "Single active consumer",
    notes: "If set, makes sure only one consumer at a time consumes from the queue and fails over to another registered consumer in case the active one is cancelled or dies.",
    args: [{ key: "x-single-active-consumer", type: "boolean", value: "true" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: '(Sets the "x-single-active-consumer" argument.)'
    }
  },
  {
    id: "dead-letter-exchange",
    label: "Dead letter exchange",
    notes: "Optional name of an exchange to which messages will be republished if they are rejected or expire.",
    args: [{ key: "x-dead-letter-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-exchange" argument.)'
    }
  },
  {
    id: "dead-letter-routing-key",
    label: "Dead letter routing key",
    notes: "Optional replacement routing key to use when a message is dead-lettered. If this is not set, the message's original routing key will be used.",
    args: [{ key: "x-dead-letter-routing-key", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-routing-key" argument.)'
    }
  },
  {
    id: "dead-letter-strategy",
    label: "Dead letter strategy",
    notes: "Valid values are at-most-once or at-least-once. It defaults to at-most-once. If at-least-once is set, Overflow behaviour must be set to reject-publish. Otherwise, dead letter strategy will fall back to at-most-once.",
    args: [{ key: "x-dead-letter-strategy", type: "string", value: "at-most-once" }],
  },
  {
    id: "max-length",
    label: "Max length",
    notes: "How many (ready) messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [
      { key: "x-max-length", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length" argument.)'
    }
  },
  {
    id: "max-length",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [
      { key: "x-max-length-bytes", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "delivery-limit",
    label: "Delivery limit",
    notes: 'The number of allowed unsuccessful delivery attempts. Once a message has been delivered unsuccessfully more than this many times it will be dropped or dead-lettered, depending on the queue configuration. The default is always 20. A value of -1 sets the limit to "unlimited".',
    args: [{ key: "x-delivery-limit", type: "number", value: "20" }],
  },
  {
    id: "x-quorum-initial-group-size",
    label: "Initial cluster size",
    notes: "Set the queue initial cluster size, i.e. number of queue members/replicas",
    args: [{ key: "x-quorum-initial-group-size", type: "number", value: "3" }],
  },
  {
    id: "x-quorum-target-group-size",
    label: "Target cluster siz",
    notes: "The target number of replicas. Used by the periodic membership reconciliation mechanism.",
    args: [{ key: "x-quorum-target-group-size", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues#member-reconciliation",
      label: '(Sets "Continuous Membership Reconciliation (CMR)".)'
    }
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
  {
    id: "delayed-retry",
    label: "Delayed retry",
    notes: "The type of delayed retry for quorum queues. Valid values are all (retry all returned and failed messages), failed (retry only failed messages), returned (retry only returned messages), or disabled. You must also set delayed-retry-min for delayed retry to be enabled.",
    args: [
      { key: "x-delayed-retry-type", type: "string", value: "" },
      { key: "x-delayed-retry-min", type: "number", value: "" },
      { key: "x-delayed-retry-max", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "x-consumer-disconnected-timeout",
    label: "Consumer disconnected timeout",
    notes: 'How long to wait (in milliseconds) before returning checked out messages when a consumer\'s node becomes unreachable. Defaults to 60000 (60 seconds). (Sets the "x-consumer-disconnected-timeout" argument.)',
    args: [{ key: "x-consumer-disconnected-timeout", type: "number", value: "" }],
  },
  {
    id: "x-member-placement-tag",
    label: "Consumer disconnected timeout",
    notes: 'Node tag key used for AZ-aware quorum queue member placement. When set, replicas are spread across distinct values of this tag (e.g. az). Requires nodes to be tagged with the matching key via the node_tags configuration.',
    args: [{ key: "x-member-placement-tag", type: "string", value: "" }],
  },
];

const STREAM_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "max-length-bytes",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "max-age",
    label: "Max age",
    notes: "Sets the data retention for stream queues in time units (Y=Years, M=Months, D=Days, h=hours, m=minutes, s=seconds). E.g. \"1h\" configures the stream to only keep the last 1 hour of received messages.",
    args: [{ key: "x-max-age", type: "string", value: "7D" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the x-max-age argument.)'
    }
  },
  {
    id: "max-segment-size",
    label: "Max segment size in bytes",
    notes: "Size of each stream segment file",
    args: [
      { key: "x-stream-max-segment-size-bytes", type: "number", value: "500000000" },
    ],
  },
  {
    id: "initial-cluster-size",
    label: "Initial cluster size",
    notes: "Sets the data retention for stream queues in time units (Y=Years, M=Months, D=Days, h=hours, m=minutes, s=seconds). E.g. \"1h\" configures the stream to only keep the last 1 hour of received messages.",
    args: [{ key: "x-initial-cluster-size", type: "number", value: "3" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the x-max-age argument.)'
    }
  },
  {
    id: "filter-size",
    label: "Filter size (per chunk) in bytes",
    notes: "Size of the filter data attached to each stream chunk. (Sets the x-stream-filter-size-bytes argument.)",
    args: [{ key: "x-stream-filter-size-bytes", type: "number", value: "16" }],
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
];

const ARGUMENT_PRESETS: Record<QueueDeclarationType, ArgumentPreset[]> = {
  default: CLASSIC_ARGUMENT_PRESETS,
  classic: CLASSIC_ARGUMENT_PRESETS,
  quorum: QUORUM_ARGUMENT_PRESETS,
  stream: STREAM_ARGUMENT_PRESETS,
};

function parsePairValue(raw: string): QueueArgumentValue {
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

function parseArgumentPairs(text: string): {
  args: Record<string, QueueArgumentValue>;
  error: string | null;
} {
  const args: Record<string, QueueArgumentValue> = {};
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const separator = line.search(/[=:]/);
    const label = `Line ${index + 1}`;
    if (separator === -1) {
      return { args, error: `${label}: use key=value.` };
    }
    const key = line.slice(0, separator).trim();
    if (!key) {
      return { args, error: `${label}: add a key before the separator.` };
    }
    if (key === "x-queue-type") {
      return { args, error: "x-queue-type is set by the queue type selector." };
    }
    if (key in args) {
      return { args, error: `Argument ${key} is defined more than once.` };
    }
    args[key] = parsePairValue(line.slice(separator + 1));
  }
  return { args, error: null };
}

function rowValueToText(row: ArgumentRow): string {
  switch (row.type) {
    case "boolean":
      return row.value === "true" ? "true" : "false";
    case "list": {
      const items = row.value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      return JSON.stringify(items);
    }
    default:
      return row.value.trim();
  }
}

function rowsToArgumentText(rows: ArgumentRow[]): string {
  return rows
    .filter((row) => row.key.trim())
    .map((row) => `${row.key.trim()}=${rowValueToText(row)}`)
    .join("\n");
}

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

function rowsToArgumentObject(
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

function rowsToJsonText(rows: ArgumentRow[]): string {
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

function parsePairsToRows(
  text: string,
  nextId: () => number
): ArgumentRow[] {
  const rows: ArgumentRow[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.search(/[=:]/);
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || key === "x-queue-type") continue;
    rows.push({
      id: nextId(),
      key,
      ...pairTextToRow(trimmed.slice(separator + 1)),
    });
  }
  return rows;
}

function parseJsonToRows(text: string, nextId: () => number): ArgumentRow[] {
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

function parseArgumentsJson(text: string): {
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

function parsePublishHeaders(text: string): {
  headers: Record<string, PublishHeaderValue>;
  error: string | null;
} {
  if (!text.trim()) return { headers: {}, error: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { headers: {}, error: "Headers must be valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { headers: {}, error: "Headers must be a JSON object." };
  }
  const headers: Record<string, PublishHeaderValue> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      headers[key] = value;
      continue;
    }
    return {
      headers,
      error: `Header ${key} must be a string, number, or boolean.`,
    };
  }
  return { headers, error: null };
}

function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={label}
            />
          }
        >
          <InfoIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-pretty">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Field({
  label,
  hint,
  info,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  info?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {info ? (
          <InfoTooltip label={`About ${label.toLowerCase()}`}>
            {info}
          </InfoTooltip>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-input px-2.5 py-1">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Switch className="shrink-0" checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function VhostSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { data } = useCluster();
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data.vhosts.map((vhost) => (
          <SelectItem key={vhost.name} value={vhost.name}>
            {vhost.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DialogBody({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4">{children}</div>;
}

function AddQueueDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [type, setType] = useState<QueueDeclarationType>("default");
  const [durable, setDurable] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [argumentRows, setArgumentRows] = useState<ArgumentRow[]>([]);
  const [argumentMode, setArgumentMode] = useState<ArgumentMode>("inputs");
  const [argumentText, setArgumentText] = useState("");
  const [argumentJson, setArgumentJson] = useState("");
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetSelection, setPresetSelection] = useState<string[]>([]);
  const [error, setError] = useState("");
  const nextArgumentId = useRef(0);

  const showDurable = type === "default" || type === "classic";
  const showAutoDelete = type === "classic";

  const addArgumentRow = () => {
    const id = (nextArgumentId.current += 1);
    setArgumentRows((rows) => [
      ...rows,
      { id, key: "", type: "string", value: "" },
    ]);
    setError("");
  };

  const updateArgumentRow = (
    id: number,
    patch: Partial<Omit<ArgumentRow, "id">>
  ) => {
    setArgumentRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.type && patch.type !== row.type) {
          if (
            patch.type === "boolean" &&
            next.value !== "true" &&
            next.value !== "false"
          ) {
            next.value = "true";
          }
          if (
            patch.type === "number" &&
            next.value !== "" &&
            !Number.isFinite(Number(next.value))
          ) {
            next.value = "";
          }
        }
        return next;
      })
    );
    setError("");
  };

  const removeArgumentRow = (id: number) => {
    setArgumentRows((rows) => rows.filter((row) => row.id !== id));
    setError("");
  };

  const changeArgumentMode = (mode: ArgumentMode) => {
    if (mode === argumentMode) return;
    setError("");
    const nextId = () => (nextArgumentId.current += 1);
    const rows =
      argumentMode === "pairs"
        ? parsePairsToRows(argumentText, nextId)
        : argumentMode === "json"
          ? parseJsonToRows(argumentJson, nextId)
          : argumentRows;
    setArgumentRows(rows);
    if (mode === "pairs") setArgumentText(rowsToArgumentText(rows));
    if (mode === "json") setArgumentJson(rowsToJsonText(rows));
    setArgumentMode(mode);
  };

  const togglePreset = (id: string, checked: boolean) => {
    setPresetSelection((selected) =>
      checked ? [...selected, id] : selected.filter((item) => item !== id)
    );
  };

  const applyPresets = () => {
    const presets = ARGUMENT_PRESETS[type].filter((preset) =>
      presetSelection.includes(preset.id)
    );
    if (presets.length === 0) return;
    const nextId = () => (nextArgumentId.current += 1);
    const base =
      argumentMode === "pairs"
        ? parsePairsToRows(argumentText, nextId)
        : argumentMode === "json"
          ? parseJsonToRows(argumentJson, nextId)
          : argumentRows;
    const seen = new Set(
      base.map((row) => row.key.trim()).filter((key) => key.length > 0)
    );
    const added: ArgumentRow[] = [];
    for (const preset of presets) {
      for (const arg of preset.args) {
        if (arg.key === "x-queue-type" || seen.has(arg.key)) continue;
        seen.add(arg.key);
        added.push({ id: nextId(), key: arg.key, type: arg.type, value: arg.value });
      }
    }
    const rows = [...base, ...added];
    setArgumentRows(rows);
    if (argumentMode === "pairs") setArgumentText(rowsToArgumentText(rows));
    if (argumentMode === "json") setArgumentJson(rowsToJsonText(rows));
    setPresetSelection([]);
    setPresetOpen(false);
    setError("");
  };

  const reset = () => {
    setName("");
    setVhost("/");
    setType("default");
    setDurable(true);
    setAutoDelete(false);
    setArgumentRows([]);
    setArgumentMode("inputs");
    setArgumentText("");
    setArgumentJson("");
    setPresetOpen(false);
    setPresetSelection([]);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a queue name.");
    if (data.queues.some((queue) => queue.name === clean && queue.vhost === vhost)) {
      return setError(`A queue named ${clean} already exists on ${vhost}.`);
    }
    const args: Record<string, QueueArgumentValue> = {};
    if (argumentMode === "pairs") {
      const parsed = parseArgumentPairs(argumentText);
      if (parsed.error) return setError(parsed.error);
      Object.assign(args, parsed.args);
    } else if (argumentMode === "json") {
      const parsed = parseArgumentsJson(argumentJson);
      if (parsed.error) return setError(parsed.error);
      Object.assign(args, parsed.args);
    } else {
      for (const row of argumentRows) {
        const key = row.key.trim();
        if (!key) {
          if (row.value.trim()) return setError("Add a key for every argument value.");
          continue;
        }
        if (key === "x-queue-type") {
          return setError("x-queue-type is set by the queue type selector.");
        }
        if (key in args) {
          return setError(`Argument ${key} is defined more than once.`);
        }
        switch (row.type) {
          case "number": {
            const value = row.value.trim();
            if (value === "" || !Number.isFinite(Number(value))) {
              return setError(`Argument ${key} must be a number.`);
            }
            args[key] = Number(value);
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
    }
    try {
      await actions.addQueue({
        name: clean,
        vhost,
        type,
        durable,
        autoDelete,
        args,
      });
      toast.success("Queue created", { description: `${clean} declared on ${vhost}.` });
      reset();
      onCreated?.();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The management API did not respond."
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[40vw] sm:max-w-xl"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>Add queue</SheetTitle>
            <SheetDescription>
              Declare a queue on an existing virtual host.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <Field label="Queue name" htmlFor="queue-name">
              <Input
                id="queue-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="orders.created"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Queue type">
                <Select
                  value={type}
                  onValueChange={(next) => {
                    setType(String(next) as QueueDeclarationType);
                    setPresetSelection([]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUEUE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {showDurable || showAutoDelete ? (
              <div className={cn("grid gap-2", showAutoDelete && "sm:grid-cols-2")}>
                {showDurable ? (
                  <ToggleField
                    label="Durable"
                    hint="Survives a broker restart"
                    checked={durable}
                    onCheckedChange={setDurable}
                  />
                ) : null}
                {showAutoDelete ? (
                  <ToggleField
                    label="Auto-delete"
                    hint="Removed with its last consumer"
                    checked={autoDelete}
                    onCheckedChange={setAutoDelete}
                  />
                ) : null}
              </div>
            ) : null}
            <Field
              label="Arguments"
              hint={
                argumentMode === "pairs"
                  ? "One key=value pair per line. true/false, numbers, and [JSON arrays] are typed automatically; quote a value to keep it a string."
                  : argumentMode === "json"
                    ? "A JSON object of arguments. Values may be strings, numbers, booleans, or arrays; x-queue-type is added from the queue type selector."
                    : type === "default"
                      ? "Optional key/value pairs with a type. List values are comma-separated."
                      : "Optional key/value pairs with a type. List values are comma-separated; x-queue-type is added from the queue type selector."
              }
            >
              <Tabs
                value={argumentMode}
                onValueChange={(next) =>
                  changeArgumentMode(String(next) as ArgumentMode)
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <TabsList>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="pairs">Key / value</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <Popover open={presetOpen} onOpenChange={setPresetOpen}>
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
                          const selected = presetSelection.includes(preset.id);
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
                                  return;
                                }
                                togglePreset(preset.id, !selected);
                              }}
                            >
                              <Checkbox
                                aria-label={preset.label}
                                checked={selected}
                                onCheckedChange={(checked) =>
                                  togglePreset(preset.id, checked)
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
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={presetSelection.length === 0}
                        onClick={applyPresets}
                      >
                        Add selected
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
                <TabsContent value="inputs" className="flex flex-col gap-2">
                  {argumentRows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <Input
                        aria-label="Argument key"
                        placeholder="x-max-length"
                        value={row.key}
                        className="min-w-0 flex-1 font-mono"
                        onChange={(event) =>
                          updateArgumentRow(row.id, { key: event.target.value })
                        }
                      />
                      <Select
                        value={row.type}
                        onValueChange={(next) =>
                          updateArgumentRow(row.id, {
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
                              updateArgumentRow(row.id, {
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
                            updateArgumentRow(row.id, {
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
                        onClick={() => removeArgumentRow(row.id)}
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
                    onClick={addArgumentRow}
                  >
                    <PlusIcon data-icon="inline-start" aria-hidden="true" />
                    Add argument
                  </Button>
                </TabsContent>
                <TabsContent value="pairs">
                  <Textarea
                    aria-label="Arguments as key value pairs"
                    placeholder={ARGUMENT_PAIRS_PLACEHOLDER}
                    value={argumentText}
                    className="font-mono"
                    rows={4}
                    onChange={(event) => {
                      setArgumentText(event.target.value);
                      setError("");
                    }}
                  />
                </TabsContent>
                <TabsContent value="json">
                  <Textarea
                    aria-label="Arguments as JSON"
                    placeholder={ARGUMENT_JSON_PLACEHOLDER}
                    value={argumentJson}
                    className="font-mono"
                    rows={5}
                    onChange={(event) => {
                      setArgumentJson(event.target.value);
                      setError("");
                    }}
                  />
                </TabsContent>
              </Tabs>
            </Field>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
            <Button type="submit">Declare queue</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AddExchangeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [type, setType] = useState<ExchangeType>("topic");
  const [durable, setDurable] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter an exchange name.");
    if (data.exchanges.some((exchange) => exchange.name === clean && exchange.vhost === vhost)) {
      return setError(`An exchange named ${clean} already exists on ${vhost}.`);
    }
    try {
      await actions.addExchange({
        name: clean,
        vhost,
        type,
        durable,
        autoDelete,
        internal,
        args: {},
      });
      toast.success("Exchange created", { description: `${clean} (${type}) on ${vhost}.` });
      setName("");
      setError("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The management API did not respond."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add exchange</DialogTitle>
            <DialogDescription>Create a routing exchange for your topology.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Exchange name" htmlFor="exchange-name">
              <Input
                id="exchange-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="orders.retry"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Type">
                <Select
                  value={type}
                  onValueChange={(next) => setType(String(next) as ExchangeType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="fanout">Fanout</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="headers">Headers</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                label="Durable"
                hint="Survives a broker restart"
                checked={durable}
                onCheckedChange={setDurable}
              />
              <ToggleField
                label="Auto-delete"
                hint="Removed when unused"
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
              />
            </div>
            <ToggleField
              label="Internal"
              hint="Only reachable from other exchanges"
              checked={internal}
              onCheckedChange={setInternal}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Declare exchange</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function AddVhostDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tracing, setTracing] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a virtual host name.");
    if (data.vhosts.some((vhost) => vhost.name === clean)) {
      return setError(`${clean} already exists.`);
    }
    actions.addVhost({
      name: clean,
      description: description.trim() || "Custom virtual host",
      tracing,
    });
    toast.success("Virtual host created", { description: `${clean} is ready for topology.` });
    setName("");
    setDescription("");
    setTracing(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add virtual host</DialogTitle>
            <DialogDescription>Isolate queues, exchanges and permissions.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Name" htmlFor="vhost-name">
              <Input
                id="vhost-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="production-eu"
                autoFocus
              />
            </Field>
            <Field label="Description" htmlFor="vhost-description">
              <Input
                id="vhost-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="EU production workloads"
              />
            </Field>
            <ToggleField
              label="Tracing"
              hint="Copy published messages to the trace exchange"
              checked={tracing}
              onCheckedChange={setTracing}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Create virtual host</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PolicyDialog({
  open,
  onClose,
  operator = false,
}: {
  open: boolean;
  onClose: () => void;
  operator?: boolean;
}) {
  const { data, actions } = useCluster();
  const existing = operator ? data.operatorPolicies : data.policies;
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [pattern, setPattern] = useState("^orders\\.");
  const [applyTo, setApplyTo] = useState<"queues" | "exchanges" | "all">("queues");
  const [priority, setPriority] = useState(operator ? "10" : "1");
  const [definition, setDefinition] = useState("max-length=50000");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a policy name.");
    if (existing.some((policy) => policy.name === clean && policy.vhost === vhost)) {
      return setError(`A policy named ${clean} already exists on ${vhost}.`);
    }
    const parsed: Record<string, string | number> = {};
    for (const line of definition.split("\n")) {
      const [rawKey, ...rest] = line.split("=");
      const key = rawKey?.trim();
      const value = rest.join("=").trim();
      if (!key) continue;
      if (!value) return setError(`Policy ${key} needs a value.`);
      parsed[key] = Number.isFinite(Number(value)) && value !== "" ? Number(value) : value;
    }
    if (!Object.keys(parsed).length) return setError("Add at least one definition.");
    const policy = {
      name: clean,
      vhost,
      pattern: pattern.trim() || ".*",
      applyTo,
      priority: Number(priority) || 0,
      definition: parsed,
    };
    try {
      await actions.addPolicy(policy, operator);
      toast.success(operator ? "Operator policy created" : "Policy created", {
        description: `${clean} applies to ${applyTo} on ${vhost}.`,
      });
      setName("");
      setError("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The management API did not respond."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{operator ? "Add operator policy" : "Add policy"}</DialogTitle>
            <DialogDescription>
              {operator
                ? "Override user policies for matching queues and exchanges."
                : "Apply limits and behaviour by name pattern."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Policy name" htmlFor="policy-name">
                <Input
                  id="policy-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  placeholder={operator ? "operator-max-length" : "orders-dlx"}
                  autoFocus
                />
              </Field>
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pattern" htmlFor="policy-pattern" hint="Regular expression on entity names.">
                <Input
                  id="policy-pattern"
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Apply to">
                <Select
                  value={applyTo}
                  onValueChange={(next) => setApplyTo(String(next) as typeof applyTo)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queues">Queues</SelectItem>
                    <SelectItem value="exchanges">Exchanges</SelectItem>
                    <SelectItem value="all">Queues and exchanges</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <Field label="Priority" htmlFor="policy-priority">
                <Input
                  id="policy-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Definition"
                htmlFor="policy-definition"
                hint="One key=value per line, e.g. message-ttl=86400000."
              >
                <Textarea
                  id="policy-definition"
                  value={definition}
                  onChange={(event) => setDefinition(event.target.value)}
                  className="min-h-20 font-mono text-xs"
                />
              </Field>
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">{operator ? "Create operator policy" : "Create policy"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PublishDrawer({
  open,
  onClose,
  initialExchange,
  initialVhost,
}: {
  open: boolean;
  onClose: () => void;
  initialExchange?: string;
  initialVhost?: string;
}) {
  const { data, actions } = useCluster();
  const [vhost, setVhost] = useState(initialVhost ?? "/");
  const [exchange, setExchange] = useState(initialExchange ?? DEFAULT_EXCHANGE);
  const [routingKey, setRoutingKey] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"1" | "2">("1");
  const [payload, setPayload] = useState('{\n  "orderId": "ord_1042",\n  "status": "created"\n}');
  const [headers, setHeaders] = useState("");
  const [headersOpen, setHeadersOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setHeadersOpen(false);
  }, [open]);

  const isDefaultExchange = exchange === DEFAULT_EXCHANGE;
  const resolvedName = isDefaultExchange ? "" : exchange;
  const exchangeRecord = data.exchanges.find(
    (entry) => entry.name === resolvedName && entry.vhost === vhost
  );
  const targets = isDefaultExchange
    ? data.queues
        .filter((queue) => queue.vhost === vhost && queue.name === routingKey.trim())
        .map((queue) => queue.name)
    : exchangeRecord
      ? routeTargets(exchangeRecord, routingKey, data.bindings, data.queues)
      : [];
  const parsedHeaders = parsePublishHeaders(headers);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (parsedHeaders.error) {
      setHeadersOpen(true);
      return setError(parsedHeaders.error);
    }
    try {
      const routed = await actions.publish({
        exchange: resolvedName,
        vhost,
        routingKey: routingKey.trim(),
        payload,
        properties: {
          deliveryMode: deliveryMode === "2" ? 2 : 1,
          headers: parsedHeaders.headers,
        },
      });
      toast.success("Message published", {
        description: routed
          ? targets.length > 0
            ? `Routed to ${targets.join(", ")}`
            : "Routed to a matching destination."
          : "No queue matched the routing key, the message was dropped.",
      });
      setError("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The management API did not respond."
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[40vw] data-[side=right]:sm:max-w-[42rem]!"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>Publish message</SheetTitle>
            <SheetDescription>Send a message through the selected exchange.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Virtual host"
                info="Virtual hosts isolate exchanges, queues and permissions. A message is published into one virtual host."
              >
                <VhostSelect
                  value={vhost}
                  onChange={(next) => {
                    setVhost(next);
                    setExchange(DEFAULT_EXCHANGE);
                  }}
                />
              </Field>
              <Field
                label="Exchange"
                info="The exchange routes the message to queues using the routing key. The default exchange routes to the queue whose name equals the routing key."
              >
                <Select value={exchange} onValueChange={(next) => setExchange(String(next))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) =>
                        value === DEFAULT_EXCHANGE
                          ? "(default exchange)"
                          : String(value)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_EXCHANGE}>(default exchange)</SelectItem>
                    {data.exchanges
                      .filter((entry) => entry.vhost === vhost && entry.name !== "")
                      .map((entry) => (
                        <SelectItem key={entry.name} value={entry.name}>
                          {entry.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label="Routing key"
              htmlFor="publish-routing-key"
              hint={
                targets.length
                  ? `Routes to ${targets.join(", ")}`
                  : "No queue currently matches this key."
              }
              info="The key the exchange matches against binding keys. For the default exchange it must be the destination queue name."
            >
              <Input
                id="publish-routing-key"
                value={routingKey}
                onChange={(event) => setRoutingKey(event.target.value)}
                placeholder="orders.created"
                className="font-mono"
              />
            </Field>
            <Field
              label="Delivery mode"
              htmlFor="publish-delivery-mode"
              hint="1 = transient, 2 = persistent."
              info="Persistent (2) messages are written to disk when routed to a durable queue. Transient (1) messages may be lost when the broker restarts."
            >
              <Select
                value={deliveryMode}
                onValueChange={(next) =>
                  setDeliveryMode(String(next) as "1" | "2")
                }
              >
                <SelectTrigger id="publish-delivery-mode" className="w-full">
                  <SelectValue>
                    {(value) =>
                      value === "2" ? "Persistent (2)" : "Transient (1)"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Transient (1)</SelectItem>
                  <SelectItem value="2">Persistent (2)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Payload"
              htmlFor="publish-payload"
              hint="JSON body attached to each message."
              info="The message body is sent as-is using string payload encoding; JSON is only a convention."
            >
              <Textarea
                id="publish-payload"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                className="min-h-28 font-mono text-xs"
              />
            </Field>
            <Collapsible
              open={headersOpen}
              onOpenChange={(next) => {
                setHeadersOpen(next);
                setError("");
              }}
            >
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
                      headersOpen && "rotate-90"
                    )}
                  />
                  Headers
                </CollapsibleTrigger>
                <InfoTooltip label="About headers">
                  Headers can have any name. Only long string headers can be
                  set here.
                </InfoTooltip>
              </div>
              <CollapsibleContent className="flex flex-col gap-1.5 pt-1">
                <Textarea
                  id="publish-headers"
                  aria-label="Headers JSON"
                  value={headers}
                  onChange={(event) => {
                    setHeaders(event.target.value);
                    setError("");
                  }}
                  placeholder={'{\n  "x-tenant": "acme"\n}'}
                  className="min-h-20 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {'JSON object, for example {"x-tenant": "acme"}. Values may be strings, numbers, or booleans.'}
                </p>
              </CollapsibleContent>
            </Collapsible>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
            <Button type="submit">Publish</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function LimitsDialog({
  open,
  onClose,
  initialVhost,
}: {
  open: boolean;
  onClose: () => void;
  initialVhost?: string;
}) {
  const { data, actions } = useCluster();
  const [vhost, setVhost] = useState(initialVhost ?? data.limits[0]?.vhost ?? "/");
  const current = data.limits.find((limit) => limit.vhost === vhost);
  const [connections, setConnections] = useState(String(current?.maxConnections ?? 1024));
  const [queues, setQueues] = useState(String(current?.maxQueues ?? 2048));
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const maxConnections = Number(connections);
    const maxQueues = Number(queues);
    if (!Number.isFinite(maxConnections) || maxConnections < 1) {
      return setError("Max connections must be a positive number.");
    }
    if (!Number.isFinite(maxQueues) || maxQueues < 1) {
      return setError("Max queues must be a positive number.");
    }
    actions.updateLimit({ vhost, maxConnections, maxQueues });
    toast.success("Limits updated", { description: `${vhost} limits were saved.` });
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit limits</DialogTitle>
            <DialogDescription>Cap connections and queues for a virtual host.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Virtual host">
              <Select
                value={vhost}
                onValueChange={(next) => {
                  const value = String(next);
                  setVhost(value);
                  const limit = data.limits.find((entry) => entry.vhost === value);
                  setConnections(String(limit?.maxConnections ?? 1024));
                  setQueues(String(limit?.maxQueues ?? 2048));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.vhosts.map((entry) => (
                    <SelectItem key={entry.name} value={entry.name}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max connections" htmlFor="limit-connections">
                <Input
                  id="limit-connections"
                  value={connections}
                  onChange={(event) => setConnections(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Max queues" htmlFor="limit-queues">
                <Input
                  id="limit-queues"
                  value={queues}
                  onChange={(event) => setQueues(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Save limits</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SHORTCUTS = [
  ["⌘ K", "Open the command palette"],
  ["?", "Show keyboard shortcuts"],
  ["g o", "Go to overview"],
  ["g q", "Go to queues"],
  ["g e", "Go to exchanges"],
  ["g c", "Go to connections"],
  ["g u", "Go to users"],
  ["g v", "Go to virtual hosts"],
  ["g p", "Go to policies"],
  ["g l", "Go to limits"],
  ["g f", "Go to feature flags"],
  ["g d", "Go to deprecated features"],
  ["g k", "Go to cluster"],
  ["g i", "Go to import / export"],
  ["d", "Toggle dark mode"],
  ["⌘ B", "Collapse the sidebar"],
  ["Esc", "Close the current layer"],
];

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the management UI without a mouse.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd className="border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const closeDialog = () => setDialog(null);

  const value = useMemo<DialogsContextValue>(
    () => ({ dialog, openDialog: setDialog, closeDialog }),
    [dialog]
  );

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddQueueDrawer
        open={dialog?.type === "add-queue"}
        onClose={closeDialog}
        onCreated={dialog?.type === "add-queue" ? dialog.onCreated : undefined}
      />
      <AddExchangeDialog open={dialog?.type === "add-exchange"} onClose={closeDialog} />
      <AddUserDialog open={dialog?.type === "add-user"} onClose={closeDialog} />
      <AddVhostDialog open={dialog?.type === "add-vhost"} onClose={closeDialog} />
      <PolicyDialog open={dialog?.type === "add-policy"} onClose={closeDialog} />
      <PolicyDialog
        open={dialog?.type === "add-operator-policy"}
        onClose={closeDialog}
        operator
      />
      <PublishDrawer
        open={dialog?.type === "publish"}
        onClose={closeDialog}
        initialExchange={dialog?.type === "publish" ? dialog.exchange : undefined}
        initialVhost={dialog?.type === "publish" ? dialog.vhost : undefined}
      />
      <LimitsDialog
        open={dialog?.type === "edit-limits"}
        onClose={closeDialog}
        initialVhost={dialog?.type === "edit-limits" ? dialog.vhost : undefined}
      />
      <ShortcutsDialog open={dialog?.type === "shortcuts"} onClose={closeDialog} />
    </DialogsContext.Provider>
  );
}

export function useDialogs(): DialogsContextValue {
  const context = useContext(DialogsContext);
  if (!context) throw new Error("useDialogs must be used inside DialogsProvider");
  return context;
}
