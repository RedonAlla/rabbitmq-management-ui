import { useMemo } from "react";
import {
  RateChart,
  buildRateChartDataFromSamples,
} from "@/views/connections/rate-chart";
import { fmtRate } from "@/lib/format";
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api";
import {
  averageSeries,
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

export function ReductionsChart({
  detail,
  range,
  setRange,
  loading,
  error,
  onRetry,
}: Props) {
  const data = useMemo(() => {
    if (!detail) return [];
    return buildRateChartDataFromSamples([
      { key: "reductions", samples: detail.rates.reductions.samples },
    ]);
  }, [detail]);

  return (
    <QueueChartFrame
      title="Reductions"
      description={`Erlang reductions per second over the ${QUEUE_RATE_WINDOW[range]}.`}
      actions={<QueueRangeTabs range={range} onRangeChange={setRange} />}
      hasData={data.length > 1}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyDescription="The broker has not recorded reductions for this range."
    >
      <RateChart
        title="Reductions"
        data={data}
        series={[
          {
            key: "reductions",
            label: "Reductions",
            color: "var(--chart-3)",
            legend: `Reductions avg ${fmtRate(
              averageSeries(data, "reductions")
            )}`,
          },
        ]}
      />
    </QueueChartFrame>
  );
}
