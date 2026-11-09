import { useMemo, useState, type ReactNode } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ChartSkeleton,
  RegionEmpty,
  RegionError,
} from "@/components/region-states"
import { fmtCompact } from "@/lib/format"
import type { HistoryPoint, RangeKey } from "@/data/types"
import { cn } from "@/lib/utils"

export interface SeriesDef {
  key: keyof HistoryPoint
  label: string
  color: string
}

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "1h", label: "1h" },
  { value: "1d", label: "1d" },
]

interface ChartPanelProps {
  title: string
  description?: string
  data: HistoryPoint[]
  series: SeriesDef[]
  range: RangeKey
  onRangeChange: (range: RangeKey) => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyAction?: ReactNode
  emptyDescription?: string
  valueFormatter?: (value: number) => string
}

export function ChartPanel({
  title,
  description,
  data,
  series,
  range,
  onRangeChange,
  loading = false,
  error,
  onRetry,
  emptyAction,
  emptyDescription = "Message rates appear after the first delivery window.",
  valueFormatter = fmtCompact,
}: ChartPanelProps) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const config = useMemo<ChartConfig>(() => {
    const next: ChartConfig = {}
    for (const item of series) {
      next[item.key] = { label: item.label, color: item.color }
    }
    return next
  }, [series])

  const visibleSeries = series.filter((item) => !hidden[item.key])

  return (
    <Frame spacing="sm" className="min-w-0">
      <FrameHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <FrameTitle>{title}</FrameTitle>
          {description ? (
            <FrameDescription>{description}</FrameDescription>
          ) : null}
        </div>
        <Tabs
          value={range}
          onValueChange={(value) => onRangeChange(value as RangeKey)}
        >
          <TabsList aria-label="Chart range">
            {RANGES.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="px-2 text-xs"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </FrameHeader>
      <FramePanel className="flex min-w-0 flex-col gap-3">
        {error ? (
          <RegionError message={error} onRetry={onRetry ?? (() => undefined)} />
        ) : loading ? (
          <ChartSkeleton />
        ) : !data.length ? (
          <RegionEmpty
            title="No samples yet"
            description={emptyDescription}
            action={emptyAction}
          />
        ) : (
          <>
            <div
              className="flex flex-wrap items-center gap-1"
              role="group"
              aria-label="Series visibility"
            >
              {series.map((item) => {
                const isVisible = !hidden[item.key]
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={isVisible}
                    onClick={() =>
                      setHidden((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                      !isVisible && "opacity-45"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <ChartContainer
              config={config}
              className="aspect-auto h-[220px] w-full sm:h-[252px]"
              role="img"
              aria-label={`${title} chart`}
            >
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={30}
                />
                <YAxis
                  width={44}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={(value: number) => valueFormatter(value)}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => valueFormatter(Number(value))}
                    />
                  }
                />
                {visibleSeries.map((item) => (
                  <Area
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={String(item.key)}
                    stroke={`var(--color-${String(item.key)})`}
                    fill={`var(--color-${String(item.key)})`}
                    fillOpacity={0.14}
                    strokeWidth={1.6}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          </>
        )}
      </FramePanel>
    </Frame>
  )
}
