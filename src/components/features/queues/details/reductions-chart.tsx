import { useMemo } from "react";
import { fmtRate } from "@/lib/format";
import {
  averageSeries,
  buildRateChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data";
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api";
import {
  ChartFrame,
  ChartRangeTabs,
  RateChart,
} from "@/components/charts";

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
    <ChartFrame
      title="Reductions"
      description={`Erlang reductions per second over the ${RATE_WINDOWS[range]}.`}
      actions={<ChartRangeTabs value={range} onChange={setRange} options={RATE_RANGES} />}
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
    </ChartFrame>
  );
}
