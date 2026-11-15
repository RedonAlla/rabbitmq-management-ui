import type { ReactNode } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SectionFrame } from "@/components/detail";
import {
  ChartSkeleton,
  RegionEmpty,
  RegionError,
} from "@/components/region-states";
import { fmtCompact, fmtInt } from "@/lib/format";
import type {
  ConnectionRateSample,
  QueueRateRange,
} from "@/lib/rabbit-api";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const QUEUE_RATE_RANGES: {
  value: QueueRateRange;
  label: string;
  ariaLabel: string;
}[] = [
  { value: 60, label: "1m", ariaLabel: "Last minute" },
  { value: 600, label: "10m", ariaLabel: "Last ten minutes" },
  { value: 3600, label: "1h", ariaLabel: "Last hour" },
];

export const QUEUE_RATE_WINDOW: Record<QueueRateRange, string> = {
  60: "last minute",
  600: "last ten minutes",
  3600: "last hour",
};

export interface QueueChartPoint {
  label: string;
  [series: string]: string | number | undefined;
}

export interface QueueChartSeries {
  key: string;
  label: string;
  color: string;
  legend?: string;
}

export function chronological(samples: ConnectionRateSample[]): number[] {
  return [...samples]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((sample) => sample.sample);
}

export function rateValues(samples: ConnectionRateSample[]): number[] {
  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  const values: number[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const seconds = (current.timestamp - previous.timestamp) / 1000;
    if (seconds <= 0) continue;
    values.push(Math.max(0, (current.sample - previous.sample) / seconds));
  }
  return values;
}

export function averageSeries(data: QueueChartPoint[], key: string): number {
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

export function buildLengthChartDataFromSamples(
  series: { key: string; samples: ConnectionRateSample[] }[]
): QueueChartPoint[] {
  const values = new Map<string, Map<number, number>>();
  const timestamps = new Set<number>();
  for (const item of series) {
    const ordered = [...item.samples].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const byTimestamp = new Map<number, number>();
    for (const sample of ordered) {
      byTimestamp.set(sample.timestamp, sample.sample);
      timestamps.add(sample.timestamp);
    }
    values.set(item.key, byTimestamp);
  }

  return [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) => {
      const point: QueueChartPoint = { label: timeFmt.format(timestamp) };
      for (const item of series) {
        point[item.key] = values.get(item.key)?.get(timestamp);
      }
      return point;
    });
}

export function QueueRangeTabs({
  range,
  onRangeChange,
}: {
  range: QueueRateRange;
  onRangeChange: (range: QueueRateRange) => void;
}) {
  return (
    <Tabs
      value={String(range)}
      onValueChange={(value) => onRangeChange(Number(value) as QueueRateRange)}
    >
      <TabsList aria-label="Chart range">
        {QUEUE_RATE_RANGES.map((item) => (
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
}

interface ChartFrameProps {
  title: string;
  description: string;
  actions: ReactNode;
  hasData: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyDescription: string;
  children: ReactNode;
}

export function QueueChartFrame({
  title,
  description,
  actions,
  hasData,
  loading,
  error,
  onRetry,
  emptyDescription,
  children,
}: ChartFrameProps) {
  return (
    <SectionFrame
      title={title}
      description={description}
      actions={actions}
    >
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <ChartSkeleton />
      ) : hasData ? (
        children
      ) : (
        <RegionEmpty
          title="No samples yet"
          description={emptyDescription}
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

export function LengthChart({
  title,
  data,
  series,
}: {
  title: string;
  data: QueueChartPoint[];
  series: QueueChartSeries[];
}) {
  const config: ChartConfig = {};
  for (const item of series) {
    config[item.key] = { label: item.label, color: item.color };
  }
  const legendItems = series.filter((item) => item.legend);

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[200px] w-full [&_.recharts-tooltip-wrapper]:z-50"
      role="img"
      aria-label={`${title} chart`}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={30}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tickFormatter={(value: number) => fmtCompact(value)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color ?? item.stroke }}
                  />
                  <span className="flex-1 text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {fmtInt(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        {series.map((item) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={`var(--color-${item.key})`}
            fill={`var(--color-${item.key})`}
            fillOpacity={0.14}
            strokeWidth={1.6}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
        {legendItems.length ? (
          <ChartLegend
            content={
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
                {legendItems.map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.legend}
                  </span>
                ))}
              </div>
            }
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
