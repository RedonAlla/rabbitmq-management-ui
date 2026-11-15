import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
  WaypointsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail";
import { TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { bindingSummary, fmtInt, fmtRate } from "@/lib/format";
import { routeTargets } from "@/lib/topology";
import { NotFoundView } from "@/views/not-found";

export function ExchangeDetailView() {
  const { route, navigate } = useRoute();
  const { data, actions } = useCluster();
  const { openDialog } = useDialogs();
  const [routingKey, setRoutingKey] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exchange = data.exchanges.find(
    (entry) => entry.name === route.id && entry.name !== ""
  );

  const bindings = useMemo(
    () =>
      data.bindings.filter(
        (binding) =>
          binding.source === exchange?.name && binding.vhost === exchange?.vhost
      ),
    [data.bindings, exchange]
  );

  const targets = useMemo(
    () => (exchange ? routeTargets(exchange, routingKey, data.bindings, data.queues) : []),
    [exchange, routingKey, data.bindings, data.queues]
  );

  if (!exchange) {
    return (
      <NotFoundView
        title="Exchange not found"
        description={`No exchange named ${route.id ?? "unknown"} exists on this cluster.`}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={exchange.name}
        eyebrow={
          <>
            <TypeBadge type={exchange.type} />
            <VhostBadge>{exchange.vhost}</VhostBadge>
            {exchange.internal ? <Badge variant="outline">Internal</Badge> : null}
          </>
        }
        description={`${exchange.type} exchange on virtual host ${exchange.vhost}`}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="outline" aria-label="Exchange actions" />}
              >
                <MoreHorizontalIcon aria-hidden="true" />
                Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() =>
                    openDialog({ type: "publish", vhost: exchange.vhost, exchange: exchange.name })
                  }
                >
                  <SendIcon aria-hidden="true" />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              onClick={() =>
                openDialog({ type: "publish", vhost: exchange.vhost, exchange: exchange.name })
              }
            >
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
          </>
        }
      />

      <KpiGrid>
        <KpiCard label="Publish rate" value={fmtRate(exchange.publishRate)} detail="Messages in per second" />
        <KpiCard
          label="Deliver rate"
          value={fmtRate(exchange.deliverRate)}
          detail="Messages out per second"
          tone="success"
        />
        <KpiCard label="Bindings" value={fmtInt(bindings.length)} detail={`${new Set(bindings.map((binding) => binding.routingKey)).size} routing keys`} />
        <KpiCard
          label="Reached queues"
          value={fmtInt(new Set(bindings.map((binding) => binding.destination)).size)}
          detail="Distinct destinations"
        />
      </KpiGrid>

      <DetailLayout
        main={
          <>
            <SectionFrame
              title="Routing preview"
              description="Try a routing key to see which queues receive the message."
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="routing-preview">Routing key</Label>
                  <Input
                    id="routing-preview"
                    value={routingKey}
                    onChange={(event) => setRoutingKey(event.target.value)}
                    placeholder={
                      exchange.type === "topic" ? "orders.created.eu" : "orders.created"
                    }
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WaypointsIcon aria-hidden="true" className="size-3.5" />
                  {targets.length
                    ? `${targets.length} queue${targets.length === 1 ? "" : "s"} matched`
                    : "No queue matches yet — type a key or check the bindings below."}
                </div>
                {targets.length ? (
                  <ul className="flex flex-col divide-y divide-border">
                    {targets.map((target) => {
                      const queue = data.queues.find((entry) => entry.name === target);
                      return (
                        <li key={target}>
                          <a
                            href={routeHref("queue", target)}
                            className="flex items-center justify-between gap-3 py-2 text-sm transition-colors hover:text-primary"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                              <span className="truncate font-medium">{target}</span>
                            </span>
                            <span className="data-cell shrink-0 text-xs text-muted-foreground">
                              {queue ? `${fmtInt(queue.ready)} ready` : "missing"}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </SectionFrame>

            <SectionFrame
              title="Bindings"
              description={`${bindings.length} bindings leave this exchange.`}
            >
              {bindings.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {bindings.map((binding) => {
                    const queue = data.queues.find(
                      (entry) => entry.name === binding.destination && entry.vhost === binding.vhost
                    );
                    return (
                      <li
                        key={`${binding.destination}-${binding.routingKey}-${binding.destType}`}
                        className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                          <span className="data-cell">{binding.routingKey || "(empty)"}</span>
                          <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                          <a
                            href={routeHref(binding.destType === "queue" ? "queue" : "exchange", binding.destination)}
                            className="truncate font-medium transition-colors hover:text-primary"
                          >
                            {binding.destination}
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {binding.destType} · {queue ? `${fmtInt(queue.ready)} ready` : "no queue data"}
                          {Object.keys(binding.args).length
                            ? ` · ${bindingSummary(binding.args)}`
                            : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This exchange has no bindings. Published messages will be dropped unless an
                  alternate exchange is configured.
                </p>
              )}
            </SectionFrame>
          </>
        }
        side={
          <>
            <FactPanel
              title="Details"
              facts={[
                { label: "Virtual host", value: exchange.vhost, mono: true },
                { label: "Type", value: exchange.type },
                { label: "Durable", value: exchange.durable ? "Yes" : "No" },
                { label: "Auto-delete", value: exchange.autoDelete ? "Yes" : "No" },
                { label: "Internal", value: exchange.internal ? "Yes" : "No" },
              ]}
            />
            <SectionFrame title="Arguments" description="Exchange declaration arguments.">
              {Object.keys(exchange.args).length ? (
                <dl className="flex flex-col divide-y divide-border">
                  {Object.entries(exchange.args).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <dt className="text-xs text-muted-foreground">{key}</dt>
                      <dd className="data-cell">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">No arguments were supplied.</p>
              )}
            </SectionFrame>
          </>
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete exchange?"
        description={`This removes ${exchange.name} and every binding that leaves it. Bound queues keep their messages.`}
        confirmLabel="Delete exchange"
        tone="destructive"
        onConfirm={async () => {
          setConfirmDelete(false);
          try {
            await actions.deleteExchange(exchange.vhost, exchange.name);
            toast.success("Exchange deleted", { description: `${exchange.name} was removed.` });
            navigate(routeHref("exchanges"));
          } catch (cause) {
            toast.error("Exchange was not deleted", {
              description:
                cause instanceof Error ? cause.message : "The management API did not respond.",
            });
          }
        }}
      />
    </div>
  );
}
