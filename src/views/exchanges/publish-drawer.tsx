import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/field";
import FormError from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import JsonSection from "@/components/ui/json-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import VhostSelect from "@/components/ui/vhost-select";
import type { PublishHeaderValue } from "@/lib/rabbit-api";
import { routeTargets } from "@/lib/topology";
import { useCluster } from "@/store/cluster";

const DEFAULT_EXCHANGE = "__default__";

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

function parsePublishProperties(text: string): {
  properties: Record<string, unknown>;
  error: string | null;
} {
  if (!text.trim()) return { properties: {}, error: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { properties: {}, error: "Properties must be valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { properties: {}, error: "Properties must be a JSON object." };
  }
  return { properties: parsed as Record<string, unknown>, error: null };
}

export default function PublishDrawer({
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
  const [payloadEncoding, setPayloadEncoding] = useState<"string" | "base64">("string");
  const [properties, setProperties] = useState("");
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [headers, setHeaders] = useState("");
  const [headersOpen, setHeadersOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPropertiesOpen(false);
      setHeadersOpen(false);
    }
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
  const parsedProperties = parsePublishProperties(properties);
  const parsedHeaders = parsePublishHeaders(headers);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (parsedProperties.error) {
      setPropertiesOpen(true);
      return setError(parsedProperties.error);
    }
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
        payloadEncoding,
        properties: {
          deliveryMode: deliveryMode === "2" ? 2 : 1,
          headers: parsedHeaders.headers,
          extra: parsedProperties.properties,
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                label="Payload encoding"
                htmlFor="publish-payload-encoding"
                hint="String sends the body as UTF-8 text; Base64 is decoded by the broker."
                info="The HTTP API accepts the body as plain text (string) or Base64. Use Base64 for binary payloads; the decoded bytes become the message body."
              >
                <Select
                  value={payloadEncoding}
                  onValueChange={(next) =>
                    setPayloadEncoding(String(next) as "string" | "base64")
                  }
                >
                  <SelectTrigger id="publish-payload-encoding" className="w-full">
                    <SelectValue>
                      {(value) => (value === "base64" ? "Base64" : "String")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="base64">Base64</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label="Payload"
              htmlFor="publish-payload"
              hint={
                payloadEncoding === "base64"
                  ? "Base64-encoded body; the broker decodes it before routing."
                  : "JSON body attached to each message."
              }
              info="The body is sent as-is with string encoding. With Base64 encoding the broker decodes it first; JSON is only a convention."
            >
              <Textarea
                id="publish-payload"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                className="min-h-28 font-mono text-xs"
              />
            </Field>
            <JsonSection
              label="Properties"
              id="publish-properties"
              info={
                <div className="flex flex-col gap-2">
                  <p>
                    You can set other message properties here (delivery mode
                    and headers are pulled out as the most common cases).
                  </p>
                  <div className="flex flex-col gap-1">
                    <p>Invalid properties will be ignored. Valid properties are:</p>
                    <ul className="flex list-disc flex-col gap-0.5 pl-4">
                      {[
                        "content_type",
                        "content_encoding",
                        "priority",
                        "correlation_id",
                        "reply_to",
                        "expiration",
                        "message_id",
                        "timestamp",
                        "type",
                        "user_id",
                        "app_id",
                        "cluster_id",
                      ].map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              }
              hint={'JSON object, for example {"content_type": "application/json", "priority": 5}.'}
              pairsHint="Add one key/value pair per row. true/false, numbers and [JSON arrays] are typed automatically."
              placeholder={'{\n  "content_type": "application/json"\n}'}
              keyPlaceholder="content_type"
              valuePlaceholder="application/json"
              itemName="property"
              value={properties}
              onChange={(next) => {
                setProperties(next);
                setError("");
              }}
              open={propertiesOpen}
              onOpenChange={(next) => {
                setPropertiesOpen(next);
                setError("");
              }}
            />
            <JsonSection
              label="Headers"
              id="publish-headers"
              info="Headers can have any name. Only long string headers can be set here."
              hint={'JSON object, for example {"x-tenant": "acme"}. Values may be strings, numbers, or booleans.'}
              pairsHint="Add one key/value pair per row. true/false and numbers are typed automatically; other values are sent as strings."
              placeholder={'{\n  "x-tenant": "acme"\n}'}
              keyPlaceholder="x-tenant"
              valuePlaceholder="acme"
              itemName="header"
              value={headers}
              onChange={(next) => {
                setHeaders(next);
                setError("");
              }}
              open={headersOpen}
              onOpenChange={(next) => {
                setHeadersOpen(next);
                setError("");
              }}
            />
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
