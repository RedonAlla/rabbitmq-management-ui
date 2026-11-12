import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  SendIcon,
  TimerIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail";
import { StateBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ChartSkeleton, RegionEmpty, RegionError } from "@/components/region-states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCluster } from "@/store/cluster";
import { useChannelDetail } from "@/hooks/use-channel-detail";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt, fmtRate, fmtSince } from "@/lib/format";
import type { ChannelRateKey, ChannelRateRange } from "@/lib/rabbit-api";
import { NotFoundView } from "@/views/not-found";
import {
  RateChart,
  buildRateChartDataFromSamples,
  type RateChartPoint,
} from "@/views/connections/rate-chart";

const RATE_SERIES: { key: ChannelRateKey; label: string; color: string }[] = [
  { key: "ack", label: "Ack", color: "var(--chart-1)" },
  { key: "deliver", label: "Deliver", color: "var(--chart-2)" },
  { key: "deliverGet", label: "Deliver (get)", color: "var(--chart-3)" },
  { key: "deliverNoAck", label: "Deliver no ack", color: "var(--chart-4)" },
  { key: "get", label: "Get", color: "var(--chart-5)" },
  { key: "getEmpty", label: "Get empty", color: "var(--chart-6)" },
  { key: "getNoAck", label: "Get no ack", color: "var(--chart-7)" },
  { key: "redeliver", label: "Redeliver", color: "var(--chart-8)" },
];

const REDUCTIONS_SERIES: {
  key: ChannelRateKey;
  label: string;
  color: string;
} = { key: "reductions", label: "Reductions", color: "var(--chart-3)" };

const RATE_RANGES: {
  value: ChannelRateRange;
  label: string;
  ariaLabel: string;
}[] = [
  { value: 60, label: "1m", ariaLabel: "Last minute" },
  { value: 600, label: "10m", ariaLabel: "Last ten minutes" },
  { value: 3600, label: "1h", ariaLabel: "Last hour" },
];

const RATE_WINDOW: Record<ChannelRateRange, string> = {
  60: "last minute",
  600: "last ten minutes",
  3600: "last hour",
};

function averageSeries(data: RateChartPoint[], key: string): number {
  let sum = 0;
  let count = 0;
  for (const point of data) {
    const value = point[key];
    if (typeof value === "number") {
      sum += value;
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

interface RateChartFrameProps {
  title: string;
  description: string;
  actions: ReactNode;
  data: RateChartPoint[];
  series: { key: string; label: string; color: string; legend?: string }[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function RateChartFrame({
  title,
  description,
  actions,
  data,
  series,
  loading,
  error,
  onRetry,
}: RateChartFrameProps) {
  return (
    <SectionFrame title={title} description={description} actions={actions}>
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <ChartSkeleton />
      ) : data.length > 1 ? (
        <RateChart title={title} data={data} series={series} />
      ) : (
        <RegionEmpty
          title="No rate samples yet"
          description="The broker has not recorded samples for this range. Retry in a moment."
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              Retry
            </Button>
          }
        />
      )}
    </SectionFrame>
  );
}

export function ChannelDetailView() {
  const { route, navigate } = useRoute();
  const { data, actions } = useCluster();
  const [confirmClose, setConfirmClose] = useState(false);
  const [range, setRange] = useState<ChannelRateRange>(60);
  const {
    detail,
    loading: detailLoading,
    error: detailError,
    retry: retryDetail,
  } = useChannelDetail(route.id, range);

  const channel = data.channels.find((entry) => entry.id === route.id);
  const connection = data.connections.find((entry) => entry.id === channel?.connection);
  const consumers = useMemo(
    () => data.consumers.filter((consumer) => consumer.channel === route.id),
    [data.consumers, route.id]
  );
  const chartData = useMemo<RateChartPoint[]>(() => {
    if (!detail) return [];
    return buildRateChartDataFromSamples([
      ...RATE_SERIES.map((series) => ({
        key: series.key,
        samples: detail.rates[series.key].samples,
      })),
      {
        key: REDUCTIONS_SERIES.key,
        samples: detail.rates[REDUCTIONS_SERIES.key].samples,
      },
    ]);
  }, [detail]);
  const rateAverages = useMemo(() => {
    const averages = {} as Record<ChannelRateKey, number>;
    for (const series of [...RATE_SERIES, REDUCTIONS_SERIES]) {
      averages[series.key] = averageSeries(chartData, series.key);
    }
    return averages;
  }, [chartData]);

  const rangeControl = (
    <Tabs
      value={String(range)}
      onValueChange={(value) => setRange(Number(value) as ChannelRateRange)}
    >
      <TabsList aria-label="Chart range">
        {RATE_RANGES.map((item) => (
          <TabsTrigger
            key={item.value}
            value={String(item.value)}
            aria-label={item.ariaLabel}
            className="px-2 text-xs"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  if (!channel) {
    return (
      <NotFoundView
        title="Channel not found"
        description={`No open channel with id ${route.id ?? "unknown"}. It may have been closed.`}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={`Channel ${channel.id}`}
        eyebrow={
          <>
            <StateBadge state={channel.state} />
            <VhostBadge>{channel.vhost}</VhostBadge>
            {channel.confirmMode ? <Badge variant="info-light">Confirm mode</Badge> : null}
            {channel.transactional ? <Badge variant="warning-light">Transactional</Badge> : null}
          </>
        }
        description={
          connection
            ? `Multiplexed on ${connection.name} · ${connection.protocol}`
            : "Connection details unavailable"
        }
        actions={
          <Button type="button" variant="destructive" onClick={() => setConfirmClose(true)}>
            <XIcon data-icon="inline-start" aria-hidden="true" />
            Close channel
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Consumers"
          value={fmtInt(channel.consumers)}
          detail={`${consumers.length} subscriptions`}
          icon={<UsersIcon aria-hidden="true" />}
        />
        <KpiCard
          label="Unacked"
          value={fmtInt(channel.unacked)}
          detail="Awaiting acknowledgement"
          tone="warning"
          icon={<TimerIcon aria-hidden="true" />}
        />
        <KpiCard
          label="Publish"
          value={fmtRate(channel.publishRate)}
          detail="Messages in per second"
          icon={<MessageSquareIcon aria-hidden="true" />}
        />
        <KpiCard
          label="Deliver"
          value={fmtRate(channel.deliverRate)}
          detail="Messages out per second"
          tone="success"
          icon={<SendIcon aria-hidden="true" />}
        />
      </KpiGrid>

      <DetailLayout
        main={
          <>
            <RateChartFrame
              title="Message rates"
              description={`Delivery, get and acknowledgement rates per second over the ${RATE_WINDOW[range]}.`}
              actions={rangeControl}
              data={chartData}
              series={RATE_SERIES.map((series) => ({
                ...series,
                legend: `${series.label} avg ${fmtRate(rateAverages[series.key])}`,
              }))}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
            />
            <RateChartFrame
              title="Reductions"
              description={`Reductions per second over the ${RATE_WINDOW[range]}.`}
              actions={rangeControl}
              data={chartData}
              series={[
                {
                  ...REDUCTIONS_SERIES,
                  legend: `Reductions avg ${fmtRate(rateAverages.reductions)}`,
                },
              ]}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
            />
            <SectionFrame
              title="Consumers"
              description={`${consumers.length} subscriptions on this channel.`}
            >
              {consumers.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {consumers.map((consumer) => (
                    <li key={consumer.tag} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <a
                          href={routeHref("queue", consumer.queue)}
                          className="flex min-w-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
                        >
                          {consumer.queue}
                          <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                        </a>
                        <span className="data-cell text-xs text-muted-foreground">{consumer.tag}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        prefetch {consumer.prefetch === 0 ? "unlimited" : consumer.prefetch} ·{" "}
                        {consumer.ackRequired ? "manual ack" : "auto ack"} ·{" "}
                        {consumer.exclusive ? "exclusive" : "shared"} · active{" "}
                        {fmtSince(consumer.since, new Date().getTime())}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">This channel carries no consumers.</p>
              )}
            </SectionFrame>
          </>
        }
        side={
          <>
            <FactPanel
              title="Details"
              facts={[
                { label: "Channel id", value: channel.id, mono: true },
                { label: "Number", value: String(channel.number), mono: true },
                { label: "Connection", value: channel.connection, mono: true },
                { label: "User", value: channel.user, mono: true },
                { label: "Virtual host", value: channel.vhost, mono: true },
                { label: "Node", value: channel.node, mono: true },
                { label: "State", value: <StateBadge state={channel.state} /> },
              ]}
            />
            <FactPanel
              title="In-flight counters"
              description="Work held by this channel that has not yet been settled."
              facts={[
                { label: "Acks uncommitted", value: fmtInt(channel.acksUncommitted) },
                { label: "Messages uncommitted", value: fmtInt(channel.messagesUncommitted) },
                { label: "Messages unconfirmed", value: fmtInt(channel.messagesUnconfirmed) },
                { label: "Messages unacknowledged", value: fmtInt(channel.unacked) },
                { label: "Pending raft commands", value: fmtInt(channel.pendingRaftCommands) },
                { label: "Cached segments", value: fmtInt(channel.cachedSegments) },
              ]}
            />
            <FactPanel
              title="Flow control"
              facts={[
                { label: "Prefetch", value: channel.prefetch === 0 ? "Unlimited" : String(channel.prefetch) },
                { label: "Confirm mode", value: channel.confirmMode ? "Enabled" : "Disabled" },
                { label: "Transactional", value: channel.transactional ? "Yes" : "No" },
                { label: "Consumers", value: String(channel.consumers) },
              ]}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close channel?"
        description={`Channel ${channel.id} will be closed. Its consumers stop receiving messages and unacked deliveries are requeued.`}
        confirmLabel="Close channel"
        tone="destructive"
        onConfirm={() => {
          actions.closeChannel(channel.id);
          toast.success("Channel closed", { description: `Channel ${channel.id} was closed.` });
          navigate(routeHref("channels"));
        }}
      />
    </div>
  );
}
