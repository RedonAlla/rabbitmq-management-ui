import { useMemo, useState } from "react";
import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { DetailLayout, FactPanel } from "@/components/detail";
import { StateBadge, VhostBadge } from "@/components/badges";
import { useCluster } from "@/store/cluster";
import { useChannelDetail } from "@/hooks/use-channel-detail";
import { useRoute } from "@/lib/router";
import { fmtInt, fmtRate } from "@/lib/format";
import {
  averageSeries,
  buildRateChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
  type ChartPoint,
} from "@/lib/chart-data";
import type { ChannelRateKey, ChannelRateRange } from "@/lib/rabbit-api";
import { NotFoundView } from "@/views/not-found";
import GarbageCollectionFrame from "@/views/channels/garbage-collection-frame";
import ConsumersTable from "@/views/channels/consumers-table";
import ChannelKpis from "@/views/channels/kpis";
import { ChartFrame, ChartRangeTabs, RateChart } from "@/components/charts";
import { PrefetchHint } from "@/components/prefetch-hint";

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

export function ChannelDetailView() {
  const { route } = useRoute();
  const { data } = useCluster();
  const [range, setRange] = useState<ChannelRateRange>(60);
  const {
    detail,
    loading: detailLoading,
    error: detailError,
    retry: retryDetail,
  } = useChannelDetail(route.id, range);

  const channel = data.channels.find((entry) => entry.id === route.id);
  const connection = data.connections.find((entry) => entry.id === channel?.connection);
  const consumers = detail?.consumers ?? [];
  const chartData = useMemo<ChartPoint[]>(() => {
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
  const garbageCollection = detail?.garbageCollection ?? null;

  const rangeControl = (
    <ChartRangeTabs
      value={range}
      onChange={setRange}
      options={RATE_RANGES}
      ariaLabel="Chart range"
    />
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
      />

      <ChannelKpis channel={channel} subscriptions={consumers.length} />

      <DetailLayout
        main={
          <>
            <ChartFrame
              title="Message rates"
              description={`Delivery, get and acknowledgement rates per second over the ${RATE_WINDOWS[range]}.`}
              actions={rangeControl}
              hasData={chartData.length > 1}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
              emptyTitle="No rate samples yet"
              emptyDescription="The broker has not recorded samples for this range. Retry in a moment."
            >
              <RateChart
                title="Message rates"
                data={chartData}
                series={RATE_SERIES.map((series) => ({
                  ...series,
                  legend: `${series.label} avg ${fmtRate(rateAverages[series.key])}`,
                }))}
              />
            </ChartFrame>
            <ChartFrame
              title="Reductions"
              description={`Reductions per second over the ${RATE_WINDOWS[range]}.`}
              actions={rangeControl}
              hasData={chartData.length > 1}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
              emptyTitle="No rate samples yet"
              emptyDescription="The broker has not recorded samples for this range. Retry in a moment."
            >
              <RateChart
                title="Reductions"
                data={chartData}
                series={[
                  {
                    ...REDUCTIONS_SERIES,
                    legend: `Reductions avg ${fmtRate(rateAverages.reductions)}`,
                  },
                ]}
              />
            </ChartFrame>
            <ConsumersTable
              consumers={consumers}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
            />
            <GarbageCollectionFrame
              collection={garbageCollection}
              loading={detailLoading}
              error={detailError}
              onRetry={retryDetail}
            />
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
                {
                  label: "Prefetch",
                  hint: <PrefetchHint />,
                  value: channel.prefetch === 0 ? "Unlimited" : String(channel.prefetch),
                },
                {
                  label: "Confirm mode",
                  value: (
                    <Badge variant={channel.confirmMode ? "success-light" : "outline"}>
                      {channel.confirmMode ? "Enabled" : "Disabled"}
                    </Badge>
                  ),
                },
                { label: "Transactional", value: channel.transactional ? "Yes" : "No" },
                { label: "Consumers", value: String(channel.consumers) },
              ]}
            />
          </>
        }
      />
    </div>
  );
}
