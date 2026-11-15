import { RateChart, type RateChartPoint } from "@/views/connections/rate-chart";
import {
  averageSeries,
  QUEUE_RATE_WINDOW,
  QueueChartFrame,
  QueueRangeTabs,
} from "../shared/charts";
import type { QueueRateRange } from "@/lib/rabbit-api";
import { fmtRate } from "@/lib/format";

type Props = {
  loading: boolean;
  error: string | null;
  range: QueueRateRange;
  data: RateChartPoint[];
  onRetry: () => void;
  setRange: (range: QueueRateRange) => void;
};

export function GetRatesChart({
  loading,
  error,
  range,
  data,
  setRange,
  onRetry,
}: Props) {
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
