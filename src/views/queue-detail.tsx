import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  EraserIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { ChartPanel } from "@/components/chart-panel";
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail";
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import {
  definitionSummary,
  fmtBytesMb,
  fmtInt,
  fmtRate,
  fmtSince,
} from "@/lib/format";
import type { RangeKey } from "@/data/types";
import { NotFoundView } from "@/views/not-found";

export function QueueDetailView() {
  const { route, navigate } = useRoute();
  const { data, totals, history, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const [range, setRange] = useState<RangeKey>("1m");
  const [confirm, setConfirm] = useState<"purge" | "delete" | null>(null);

  const queue = data.queues.find((entry) => entry.name === route.id);

  const bindings = useMemo(
    () => data.bindings.filter((binding) => binding.destination === queue?.name && binding.vhost === queue?.vhost),
    [data.bindings, queue]
  );
  const consumers = useMemo(
    () => data.consumers.filter((consumer) => consumer.queue === queue?.name),
    [data.consumers, queue]
  );

  const points = useMemo(() => {
    if (!queue) return [];
    const share = totals.publishRate > 0 ? queue.publishRate / totals.publishRate : 0;
    return history[range].map((point, index, list) => {
      const isLast = index === list.length - 1;
      return {
        ...point,
        publish: isLast ? queue.publishRate : point.publish * share,
        deliver: isLast ? queue.deliverRate : point.deliver * share,
        ack: isLast ? queue.ackRate : point.ack * share,
      };
    });
  }, [history, queue, range, totals.publishRate]);

  const bindingColumns = useMemo(
    () =>
      bindings.map((binding) => ({
        key: `${binding.source}-${binding.routingKey}`,
        source: binding.source || "(default exchange)",
        routingKey: binding.routingKey || "(empty)",
        args: definitionSummary(binding.args),
      })),
    [bindings]
  );

  const consumerRows = useMemo(
    () =>
      consumers.map((consumer) => ({
        key: consumer.tag,
        tag: consumer.tag,
        channel: consumer.channel,
        connection: consumer.connection,
        prefetch: consumer.prefetch === 0 ? "unlimited" : String(consumer.prefetch),
        mode: consumer.ackRequired ? "Manual ack" : "Auto ack",
        since: fmtSince(consumer.since, new Date().getTime()),
      })),
    [consumers]
  );

  if (!queue) {
    return (
      <NotFoundView
        title="Queue not found"
        description={`No queue named ${route.id ?? "unknown"} exists on this cluster.`}
      />
    );
  }

  const confirmAction = async () => {
    if (confirm === "purge") {
      try {
        await actions.purgeQueue(queue.vhost, queue.name);
        toast.success("Queue purged", {
          description: `${fmtInt(queue.ready)} messages removed from ${queue.name}.`,
        });
      } catch (cause) {
        toast.error("Queue was not purged", {
          description:
            cause instanceof Error ? cause.message : "The management API did not respond.",
        });
      }
    }
    if (confirm === "delete") {
      try {
        await actions.deleteQueue(queue.vhost, queue.name);
        toast.success("Queue deleted", { description: `${queue.name} was removed.` });
        navigate(routeHref("queues"));
      } catch (cause) {
        toast.error("Queue was not deleted", {
          description:
            cause instanceof Error ? cause.message : "The management API did not respond.",
        });
      }
    }
    setConfirm(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={queue.name}
        eyebrow={
          <>
            <StateBadge state={queue.state} />
            <TypeBadge type={queue.type} />
            <VhostBadge>{queue.vhost}</VhostBadge>
          </>
        }
        description={`${queue.type} queue on virtual host ${queue.vhost}`}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="outline" aria-label="Queue actions" />}
              >
                <MoreHorizontalIcon aria-hidden="true" />
                Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setConfirm("purge")}>
                  <EraserIcon aria-hidden="true" />
                  Purge messages
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDialog({ type: "publish", vhost: queue.vhost })}
                >
                  <SendIcon aria-hidden="true" />
                  Publish message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirm("delete")}>
                  <Trash2Icon aria-hidden="true" />
                  Delete queue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" onClick={() => openDialog({ type: "publish", vhost: queue.vhost })}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Ready"
          value={fmtInt(queue.ready)}
          detail={queue.state === "degraded" ? "Above the depth threshold" : "Available for delivery"}
          tone={queue.state === "degraded" ? "warning" : "primary"}
        />
        <KpiCard label="Unacked" value={fmtInt(queue.unacked)} detail={`${consumers.length} consumers attached`} />
        <KpiCard label="Publish" value={fmtRate(queue.publishRate)} detail={`Deliver ${fmtRate(queue.deliverRate)}`} tone="success" />
        <KpiCard label="Memory" value={fmtBytesMb(queue.memory)} detail={`${fmtInt(queue.redelivered)} redelivered`} />
      </KpiGrid>

      <DetailLayout
        main={
          <>
            <ChartPanel
              title="Queue throughput"
              description="Publish, deliver and ack rates for this queue."
              data={points}
              series={[
                { key: "publish", label: "Publish", color: "var(--chart-1)" },
                { key: "deliver", label: "Deliver", color: "var(--chart-2)" },
                { key: "ack", label: "Ack", color: "var(--chart-3)" },
              ]}
              range={range}
              onRangeChange={setRange}
              loading={status === "loading"}
              error={error}
              onRetry={actions.retry}
            />

            <SectionFrame
              title="Bindings"
              description={`${bindings.length} ${bindings.length === 1 ? "binding delivers" : "bindings deliver"} to this queue.`}
            >
              {bindingColumns.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {bindingColumns.map((binding) => (
                    <li key={binding.key} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                        <span className="font-medium">{binding.source}</span>
                        <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                        <span className="data-cell">{binding.routingKey}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {binding.args ? `args: ${binding.args}` : "No binding arguments"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No bindings. Messages reach this queue through the default exchange only.
                </p>
              )}
            </SectionFrame>

            <SectionFrame
              title="Consumers"
              description={`${consumers.length} consumers are subscribed.`}
            >
              {consumerRows.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {consumerRows.map((consumer) => (
                    <li key={consumer.key} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{consumer.tag}</span>
                        <span className="text-xs text-muted-foreground">{consumer.mode}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="data-cell">
                          {consumer.connection} / {consumer.channel}
                        </span>
                        <span aria-hidden="true" className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                        <span>prefetch {consumer.prefetch}</span>
                        <span aria-hidden="true" className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                        <span>active {consumer.since}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No consumers. Messages accumulate until a consumer subscribes.
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
                { label: "Virtual host", value: queue.vhost, mono: true },
                { label: "Type", value: queue.type },
                { label: "Durable", value: queue.durable ? "Yes" : "No" },
                { label: "Auto-delete", value: queue.autoDelete ? "Yes" : "No" },
                { label: "Exclusive", value: queue.exclusive ? "Yes" : "No" },
                { label: "Policy", value: queue.policy ?? "—", mono: Boolean(queue.policy) },
              ]}
            />

            <SectionFrame title="Arguments" description="Queue declaration arguments.">
              {Object.keys(queue.args).length ? (
                <dl className="flex flex-col divide-y divide-border">
                  {Object.entries(queue.args).map(([key, value]) => (
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

            <SectionFrame title="Rates">
              <dl className="flex flex-col divide-y divide-border">
                <div className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <dt className="text-xs text-muted-foreground">Publish</dt>
                  <dd className="data-cell">{fmtRate(queue.publishRate)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-xs text-muted-foreground">Deliver</dt>
                  <dd className="data-cell">{fmtRate(queue.deliverRate)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2 last:pb-0">
                  <dt className="text-xs text-muted-foreground">Ack</dt>
                  <dd className="data-cell">{fmtRate(queue.ackRate)}</dd>
                </div>
              </dl>
            </SectionFrame>
          </>
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm === "purge" ? "Purge queue?" : "Delete queue?"}
        description={
          confirm === "purge"
            ? `This removes ${fmtInt(queue.ready)} ready messages from ${queue.name}. Consumers stay attached.`
            : `This permanently deletes ${queue.name} with its bindings and consumers.`
        }
        confirmLabel={confirm === "purge" ? "Purge messages" : "Delete queue"}
        tone={confirm === "delete" ? "destructive" : "default"}
        onConfirm={confirmAction}
      />
    </div>
  );
}
