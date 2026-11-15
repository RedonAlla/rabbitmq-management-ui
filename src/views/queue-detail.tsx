import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  EraserIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import {
  DetailLayout,
  FactPanel,
  SectionFrame,
} from "@/components/detail";
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import {
  ChartSkeleton,
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtBytes, fmtInt, fmtRate } from "@/lib/format";
import type { QueueRateRange } from "@/lib/rabbit-api";
import { useQueueDetail } from "@/hooks/use-queue-detail";
import {
  RateChart,
  buildRateChartDataFromSamples,
} from "@/views/connections/rate-chart";
import QueueConsumersTable from "@/views/queues/consumers-table";
import QueueBindingsFrame from "@/views/queues/bindings-frame";
import AddBindingDialog from "@/views/queues/add-binding-dialog";
import {
  QueueArgumentsFrame,
  QueueGarbageCollectionFrame,
  QueuePolicyFrame,
} from "@/views/queues/properties";
import { NotFoundView } from "@/views/not-found";
import { KpiSkeleton } from "./kpi-skeleton";
import { GetRatesChart } from "@/components/features/queues/details/get-rates-chart";
import { averageSeries, buildLengthChartDataFromSamples, LengthChart, QUEUE_RATE_WINDOW, QueueChartFrame, QueueRangeTabs } from "@/components/features/queues/shared/charts";
import QueueKpis from "@/components/features/queues/details/kpis";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function fmtTimestamp(value: string | null): string {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return timeFmt.format(timestamp);
}

function orDash(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "—";
}

export function QueueDetailView() {
  const { route, navigate } = useRoute();
  const {
    data,
    status: clusterStatus,
    error: clusterError,
    actions,
  } = useCluster();
  const { openDialog } = useDialogs();
  const [range, setRange] = useState<QueueRateRange>(600);
  const [confirm, setConfirm] = useState<"purge" | "delete" | null>(null);
  const [bindingOpen, setBindingOpen] = useState(false);

  const queue = data.queues.find((entry) => entry.name === route.id);
  const {
    detail,
    loading,
    error,
    status,
    retry: retryDetail,
  } = useQueueDetail(queue?.vhost, route.id, range);

  const bindings = useMemo(
    () =>
      data.bindings.filter(
        (binding) =>
          binding.destination === queue?.name && binding.vhost === queue?.vhost
      ),
    [data.bindings, queue]
  );

  const depthData = useMemo(() => {
    if (!detail) return [];
    return buildLengthChartDataFromSamples([
      { key: "messages", samples: detail.lengths.messages.samples },
      { key: "ready", samples: detail.lengths.ready.samples },
      { key: "unacked", samples: detail.lengths.unacked.samples },
    ]);
  }, [detail]);

  const messageRateData = useMemo(() => {
    if (!detail) return [];
    return buildRateChartDataFromSamples([
      { key: "publish", samples: detail.rates.publish.samples },
      { key: "deliver", samples: detail.rates.deliver.samples },
      { key: "ack", samples: detail.rates.ack.samples },
      { key: "redeliver", samples: detail.rates.redeliver.samples },
    ]);
  }, [detail]);

  const getRateData = useMemo(() => {
    if (!detail) return [];
    return buildRateChartDataFromSamples([
      { key: "deliverGet", samples: detail.rates.deliverGet.samples },
      { key: "get", samples: detail.rates.get.samples },
      { key: "getEmpty", samples: detail.rates.getEmpty.samples },
      { key: "getNoAck", samples: detail.rates.getNoAck.samples },
    ]);
  }, [detail]);

  const reductionData = useMemo(() => {
    if (!detail) return [];
    return buildRateChartDataFromSamples([
      { key: "reductions", samples: detail.rates.reductions.samples },
    ]);
  }, [detail]);

  const window = QUEUE_RATE_WINDOW[range];

  const rangeControl = (
    <QueueRangeTabs range={range} onRangeChange={setRange} />
  );

  const backAction = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("queues")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to queues
    </Button>
  );

  if (!queue) {
    if (clusterStatus === "loading" && !clusterError) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <PageHeader
            title={route.id ?? "Queue"}
            description="Loading queue details."
            actions={backAction}
          />
          <KpiSkeleton length={4} />
          <DetailLayout
            main={
              <>
                <SectionFrame title="Queue depth">
                  <ChartSkeleton />
                </SectionFrame>
                <SectionFrame title="Message rates">
                  <ChartSkeleton />
                </SectionFrame>
              </>
            }
            side={
              <>
                <SectionFrame title="Details">
                  <RegionSkeleton rows={6} />
                </SectionFrame>
                <SectionFrame title="Counters">
                  <RegionSkeleton rows={5} />
                </SectionFrame>
              </>
            }
          />
        </div>
      );
    }
    if (clusterError) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <PageHeader
            title={route.id ?? "Queue"}
            description="Could not resolve this queue."
            actions={backAction}
          />
          <SectionFrame title="Queue">
            <RegionError message={clusterError} onRetry={actions.retry} />
          </SectionFrame>
        </div>
      );
    }
    return (
      <NotFoundView
        title="Queue not found"
        description={`No queue named ${route.id ?? "unknown"} exists on this cluster.`}
      />
    );
  }

  if (error && !detail) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={queue.name}
          description={
            status === 404
              ? "The broker does not know this queue anymore."
              : "Could not load this queue."
          }
          actions={backAction}
        />
        <SectionFrame title="Queue">
          {status === 404 ? (
            <RegionEmpty
              title="Queue not found"
              description={`No queue named ${queue.name} on virtual host ${queue.vhost}. It may have been deleted.`}
              action={backAction}
            />
          ) : (
            <RegionError message={error} onRetry={retryDetail} />
          )}
        </SectionFrame>
      </div>
    );
  }

  const confirmAction = async () => {
    const ready = detail?.messagesReady ?? queue.ready;
    if (confirm === "purge") {
      try {
        await actions.purgeQueue(queue.vhost, queue.name);
        toast.success("Queue purged", {
          description: `${fmtInt(ready)} messages removed from ${queue.name}.`,
        });
        retryDetail();
      } catch (cause) {
        toast.error("Queue was not purged", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        });
      }
    }
    if (confirm === "delete") {
      try {
        await actions.deleteQueue(queue.vhost, queue.name);
        toast.success("Queue deleted", {
          description: `${queue.name} was removed.`,
        });
        navigate(routeHref("queues"));
      } catch (cause) {
        toast.error("Queue was not deleted", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
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
            <StateBadge state={detail?.state ?? queue.state} />
            <TypeBadge type={detail?.type ?? queue.type} />
            <VhostBadge>{queue.vhost}</VhostBadge>
            {detail?.internal ? <Badge variant="outline">Internal</Badge> : null}
            {detail?.exclusive ? (
              <Badge variant="outline">Exclusive</Badge>
            ) : null}
          </>
        }
        description={`${detail?.type ?? queue.type} queue on virtual host ${queue.vhost}${
          detail ? ` · node ${detail.node}` : ""
        }`}
        actions={
          <>
            {backAction}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Queue actions"
                  />
                }
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
                  onClick={() =>
                    openDialog({ type: "publish", vhost: queue.vhost })
                  }
                >
                  <SendIcon aria-hidden="true" />
                  Publish message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBindingOpen(true)}>
                  <GitBranchIcon aria-hidden="true" />
                  Add binding
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete queue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              onClick={() =>
                openDialog({ type: "publish", vhost: queue.vhost })
              }
            >
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
          </>
        }
      />

      {detail ? <QueueKpis detail={detail} /> : <KpiSkeleton length={4} />}

      <DetailLayout
        main={
          <>
            <QueueChartFrame
              title="Queue depth"
              description={`Messages held in the queue over the ${window}.`}
              actions={rangeControl}
              hasData={depthData.length > 1}
              loading={loading}
              error={error}
              onRetry={retryDetail}
              emptyDescription="The broker has not recorded queue length samples for this range."
            >
              <LengthChart
                title="Queue depth"
                data={depthData}
                series={[
                  {
                    key: "messages",
                    label: "Messages",
                    color: "var(--chart-1)",
                    legend: `Messages ${fmtInt(detail?.messages ?? 0)}`,
                  },
                  {
                    key: "ready",
                    label: "Ready",
                    color: "var(--chart-2)",
                    legend: `Ready ${fmtInt(detail?.messagesReady ?? 0)}`,
                  },
                  {
                    key: "unacked",
                    label: "Unacked",
                    color: "var(--chart-3)",
                    legend: `Unacked ${fmtInt(
                      detail?.messagesUnacknowledged ?? 0
                    )}`,
                  },
                ]}
              />
            </QueueChartFrame>

            <QueueChartFrame
              title="Message rates"
              description={`Publish, deliver, ack and redeliver rates per second over the ${window}.`}
              actions={rangeControl}
              hasData={messageRateData.length > 1}
              loading={loading}
              error={error}
              onRetry={retryDetail}
              emptyDescription="The broker has not recorded message rates for this range."
            >
              <RateChart
                title="Message rates"
                data={messageRateData}
                series={[
                  {
                    key: "publish",
                    label: "Publish",
                    color: "var(--chart-1)",
                    legend: `Publish avg ${fmtRate(
                      averageSeries(messageRateData, "publish")
                    )}`,
                  },
                  {
                    key: "deliver",
                    label: "Deliver",
                    color: "var(--chart-2)",
                    legend: `Deliver avg ${fmtRate(
                      averageSeries(messageRateData, "deliver")
                    )}`,
                  },
                  {
                    key: "ack",
                    label: "Ack",
                    color: "var(--chart-3)",
                    legend: `Ack avg ${fmtRate(
                      averageSeries(messageRateData, "ack")
                    )}`,
                  },
                  {
                    key: "redeliver",
                    label: "Redeliver",
                    color: "var(--chart-4)",
                    legend: `Redeliver avg ${fmtRate(
                      averageSeries(messageRateData, "redeliver")
                    )}`,
                  },
                ]}
              />
            </QueueChartFrame>

            <GetRatesChart
              loading={loading}
              error={error}
              range={range}
              data={getRateData}
              onRetry={retryDetail}
              setRange={setRange}
            />

            <QueueChartFrame
              title="Get rates"
              description={`Synchronous get and delivery rates per second over the ${window}.`}
              actions={rangeControl}
              hasData={getRateData.length > 1}
              loading={loading}
              error={error}
              onRetry={retryDetail}
              emptyDescription="No get or no-ack deliveries were recorded for this range."
            >
              <RateChart
                title="Get rates"
                data={getRateData}
                series={[
                  {
                    key: "deliverGet",
                    label: "Deliver (get)",
                    color: "var(--chart-1)",
                    legend: `Deliver get avg ${fmtRate(
                      averageSeries(getRateData, "deliverGet")
                    )}`,
                  },
                  {
                    key: "get",
                    label: "Get",
                    color: "var(--chart-2)",
                    legend: `Get avg ${fmtRate(
                      averageSeries(getRateData, "get")
                    )}`,
                  },
                  {
                    key: "getEmpty",
                    label: "Get empty",
                    color: "var(--chart-3)",
                    legend: `Get empty avg ${fmtRate(
                      averageSeries(getRateData, "getEmpty")
                    )}`,
                  },
                  {
                    key: "getNoAck",
                    label: "Get no ack",
                    color: "var(--chart-4)",
                    legend: `Get no ack avg ${fmtRate(
                      averageSeries(getRateData, "getNoAck")
                    )}`,
                  },
                ]}
              />
            </QueueChartFrame>

            <QueueChartFrame
              title="Reductions"
              description={`Erlang reductions per second over the ${window}.`}
              actions={rangeControl}
              hasData={reductionData.length > 1}
              loading={loading}
              error={error}
              onRetry={retryDetail}
              emptyDescription="The broker has not recorded reductions for this range."
            >
              <RateChart
                title="Reductions"
                data={reductionData}
                series={[
                  {
                    key: "reductions",
                    label: "Reductions",
                    color: "var(--chart-3)",
                    legend: `Reductions avg ${fmtRate(
                      averageSeries(reductionData, "reductions")
                    )}`,
                  },
                ]}
              />
            </QueueChartFrame>

            <QueueConsumersTable
              consumers={detail?.consumerDetails ?? []}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <QueueGarbageCollectionFrame
              collection={detail?.garbageCollection ?? null}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <QueueBindingsFrame
              bindings={bindings}
              onAddBinding={() => setBindingOpen(true)}
            />
          </>
        }
        side={
          detail ? (
            <>
              <FactPanel
                title="Details"
                facts={[
                  { label: "Queue name", value: detail.name, mono: true },
                  { label: "Virtual host", value: detail.vhost, mono: true },
                  { label: "Node", value: detail.node, mono: true },
                  {
                    label: "Type",
                    value: <TypeBadge type={detail.type} />,
                  },
                  {
                    label: "State",
                    value: <StateBadge state={detail.state} />,
                  },
                  { label: "Durable", value: detail.durable ? "Yes" : "No" },
                  {
                    label: "Auto-delete",
                    value: detail.autoDelete ? "Yes" : "No",
                  },
                  {
                    label: "Exclusive",
                    value: detail.exclusive ? "Yes" : "No",
                  },
                  {
                    label: "Internal",
                    value: detail.internal ? "Yes" : "No",
                  },
                  {
                    label: "Internal owner",
                    value: detail.internalOwner ? "Yes" : "No",
                  },
                  {
                    label: "Storage version",
                    value:
                      detail.storageVersion === null
                        ? "—"
                        : fmtInt(detail.storageVersion),
                  },
                ]}
              />

              <FactPanel
                title="Lifecycle"
                facts={[
                  {
                    label: "Policy",
                    value: orDash(detail.policy),
                    mono: Boolean(detail.policy),
                  },
                  {
                    label: "Operator policy",
                    value: orDash(detail.operatorPolicy),
                    mono: Boolean(detail.operatorPolicy),
                  },
                  {
                    label: "Exclusive consumer",
                    value: orDash(detail.exclusiveConsumerTag),
                    mono: Boolean(detail.exclusiveConsumerTag),
                  },
                  {
                    label: "Single active consumer",
                    value: orDash(detail.singleActiveConsumerTag),
                    mono: Boolean(detail.singleActiveConsumerTag),
                  },
                  {
                    label: "Idle since",
                    value: fmtTimestamp(detail.idleSince),
                  },
                  {
                    label: "Head message",
                    value: fmtTimestamp(detail.headMessageTimestamp),
                  },
                ]}
              />

              <FactPanel
                title="Counters"
                facts={[
                  { label: "Messages", value: fmtInt(detail.messages) },
                  { label: "Ready", value: fmtInt(detail.messagesReady) },
                  {
                    label: "Unacked",
                    value: fmtInt(detail.messagesUnacknowledged),
                  },
                  {
                    label: "Persistent",
                    value: fmtInt(detail.messagesPersistent),
                  },
                  { label: "In RAM", value: fmtInt(detail.messagesRam) },
                  {
                    label: "Ready in RAM",
                    value: fmtInt(detail.messagesReadyRam),
                  },
                  {
                    label: "Unacked in RAM",
                    value: fmtInt(detail.messagesUnacknowledgedRam),
                  },
                  { label: "Consumers", value: fmtInt(detail.consumers) },
                  {
                    label: "Consumer capacity",
                    value:
                      detail.consumerCapacity === null
                        ? "—"
                        : fmtInt(detail.consumerCapacity),
                  },
                  {
                    label: "Consumer utilisation",
                    value:
                      detail.consumerUtilisation === null
                        ? "—"
                        : `${(detail.consumerUtilisation * 100).toFixed(0)}%`,
                  },
                  { label: "Reductions", value: fmtInt(detail.reductions) },
                  {
                    label: "Reductions rate",
                    value: fmtRate(detail.rates.reductions.rate),
                  },
                ]}
              />

              <FactPanel
                title="Storage"
                facts={[
                  { label: "Memory", value: fmtBytes(detail.memory) },
                  {
                    label: "Message bytes",
                    value: fmtBytes(detail.messageBytes),
                  },
                  {
                    label: "Persistent",
                    value: fmtBytes(detail.messageBytesPersistent),
                  },
                  {
                    label: "In RAM",
                    value: fmtBytes(detail.messageBytesRam),
                  },
                  {
                    label: "Ready",
                    value: fmtBytes(detail.messageBytesReady),
                  },
                  {
                    label: "Unacked",
                    value: fmtBytes(detail.messageBytesUnacknowledged),
                  },
                ]}
              />

              <QueuePolicyFrame
                policy={detail.policy}
                operatorPolicy={detail.operatorPolicy}
                definition={detail.effectivePolicyDefinition}
                loading={loading}
                error={error}
                onRetry={retryDetail}
              />

              <QueueArgumentsFrame
                args={detail.arguments}
                loading={loading}
                error={error}
                onRetry={retryDetail}
              />
            </>
          ) : (
            <>
              <SectionFrame title="Details">
                <RegionSkeleton rows={6} />
              </SectionFrame>
              <SectionFrame title="Lifecycle">
                <RegionSkeleton rows={5} />
              </SectionFrame>
              <SectionFrame title="Counters">
                <RegionSkeleton rows={6} />
              </SectionFrame>
              <SectionFrame title="Storage">
                <RegionSkeleton rows={4} />
              </SectionFrame>
            </>
          )
        }
      />

      <AddBindingDialog
        open={bindingOpen}
        onClose={() => setBindingOpen(false)}
        vhost={queue.vhost}
        queue={queue.name}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm === "purge" ? "Purge queue?" : "Delete queue?"}
        description={
          confirm === "purge"
            ? `This removes ${fmtInt(
                detail?.messagesReady ?? queue.ready
              )} ready messages from ${queue.name}. Consumers stay attached.`
            : `This permanently deletes ${queue.name} with its bindings and consumers.`
        }
        confirmLabel={confirm === "purge" ? "Purge messages" : "Delete queue"}
        tone={confirm === "delete" ? "destructive" : "default"}
        onConfirm={confirmAction}
      />
    </div>
  );
}
