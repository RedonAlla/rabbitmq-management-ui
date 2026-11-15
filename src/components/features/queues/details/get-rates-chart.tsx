import { useMemo } from "react";
import {
  RateChart,
  buildRateChartDataFromSamples,
} from "@/views/connections/rate-chart";
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api";
import { fmtRate } from "@/lib/format";
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

export function GetRatesChart({
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
      { key: "deliverGet", samples: detail.rates.deliverGet.samples },
      { key: "get", samples: detail.rates.get.samples },
      { key: "getEmpty", samples: detail.rates.getEmpty.samples },
      { key: "getNoAck", samples: detail.rates.getNoAck.samples },
    ]);
  }, [detail]);

  return (
    <QueueChartFrame
      title="Get rates"
      description={`Synchronous get and delivery rates per second over the ${QUEUE_RATE_WINDOW[range]}.`}
      actions={<QueueRangeTabs range={range} onRangeChange={setRange} />}
      hasData={data.length > 1}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyDescription="No get or no-ack deliveries were recorded for this range."
    >
      <RateChart
        title="Get rates"
        data={data}
        series={[
          {
            key: "deliverGet",
            label: "Deliver (get)",
            color: "var(--chart-1)",
            legend: `Deliver get avg ${fmtRate(
              averageSeries(data, "deliverGet")
            )}`,
          },
          {
            key: "get",
            label: "Get",
            color: "var(--chart-2)",
            legend: `Get avg ${fmtRate(averageSeries(data, "get"))}`,
          },
          {
            key: "getEmpty",
            label: "Get empty",
            color: "var(--chart-3)",
            legend: `Get empty avg ${fmtRate(
              averageSeries(data, "getEmpty")
            )}`,
          },
          {
            key: "getNoAck",
            label: "Get no ack",
            color: "var(--chart-4)",
            legend: `Get no ack avg ${fmtRate(
              averageSeries(data, "getNoAck")
            )}`,
          },
        ]}
      />
    </QueueChartFrame>
  );
}
