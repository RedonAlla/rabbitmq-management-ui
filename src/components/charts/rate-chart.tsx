import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { fmtCompact } from "@/lib/format";
import type { ChartPoint, ChartSeries } from "@/lib/chart-data";

function formatRateValue(value: number): string {
  return value > 0 && value < 1 ? value.toFixed(2) : fmtCompact(value);
}

export function RateChart({
  title,
  data,
  series,
}: {
  title: string;
  data: ChartPoint[];
  series: ChartSeries[];
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
          tickFormatter={(value: number) => formatRateValue(value)}
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
                    {formatRateValue(Number(value))}/s
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
            content={() => (
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
            )}
          />
        ) : series.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
