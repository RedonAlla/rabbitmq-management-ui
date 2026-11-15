import { useMemo } from "react";
import { fmtInt } from "@/lib/format";
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api";
import {
  buildLengthChartDataFromSamples,
  LengthChart,
  QUEUE_RATE_WINDOW,
  QueueChartFrame,
  QueueRangeTabs,
} from "../shared/charts";

type Props = {
  detail: QueueDetail | null;
  range: QueueRateRange;
  setRange: (range: QueueRateRange) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function QueueDepthChart({
  detail,
  range,
  setRange,
  loading,
  error,
  onRetry,
}: Props) {
  const data = useMemo(() => {
    if (!detail) return [];
    return buildLengthChartDataFromSamples([
      { key: "messages", samples: detail.lengths.messages.samples },
      { key: "ready", samples: detail.lengths.ready.samples },
      { key: "unacked", samples: detail.lengths.unacked.samples },
    ]);
  }, [detail]);

  return (
    <QueueChartFrame
      title="Queue depth"
      description={`Messages held in the queue over the ${QUEUE_RATE_WINDOW[range]}.`}
      actions={<QueueRangeTabs range={range} onRangeChange={setRange} />}
      hasData={data.length > 1}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyDescription="The broker has not recorded queue length samples for this range."
    >
      <LengthChart
        title="Queue depth"
        data={data}
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
            legend: `Unacked ${fmtInt(detail?.messagesUnacknowledged ?? 0)}`,
          },
        ]}
      />
    </QueueChartFrame>
  );
}
