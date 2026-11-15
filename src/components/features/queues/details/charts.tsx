import { useMemo } from "react";
import {
  RateChart,
  buildRateChartDataFromSamples,
} from "@/views/connections/rate-chart";
import { fmtInt, fmtRate } from "@/lib/format";
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api";
import {
  averageSeries,
  buildLengthChartDataFromSamples,
  LengthChart,
  QUEUE_RATE_WINDOW,
  QueueChartFrame,
  QueueRangeTabs,
} from "../shared/charts";
import { GetRatesChart } from "./get-rates-chart";

type Props = {
  detail: QueueDetail | null;
  range: QueueRateRange;
  setRange: (range: QueueRateRange) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function QueueChartsSection({
  detail,
  range,
  setRange,
  loading,
  error,
  onRetry,
}: Props) {
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

  return (
    <>
      <QueueChartFrame
        title="Queue depth"
        description={`Messages held in the queue over the ${window}.`}
        actions={rangeControl}
        hasData={depthData.length > 1}
        loading={loading}
        error={error}
        onRetry={onRetry}
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
              legend: `Unacked ${fmtInt(detail?.messagesUnacknowledged ?? 0)}`,
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
        onRetry={onRetry}
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

      {/* <GetRatesChart
        loading={loading}
        error={error}
        range={range}
        data={getRateData}
        onRetry={onRetry}
        setRange={setRange}
      /> */}

      <QueueChartFrame
        title="Reductions"
        description={`Erlang reductions per second over the ${window}.`}
        actions={rangeControl}
        hasData={reductionData.length > 1}
        loading={loading}
        error={error}
        onRetry={onRetry}
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
    </>
  );
}
