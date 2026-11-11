import type { ReactNode } from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  tone?: "primary" | "success" | "warning" | "muted";
}

const toneClass = {
  primary: "text-primary",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  muted: "text-muted-foreground",
};

export function Sparkline({ values, tone = "primary" }: SparklineProps) {
  if (values.length < 2) return null;
  const width = 84;
  const height = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-6 w-20 shrink-0 overflow-visible", toneClass[tone])}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.85"
      />
      <circle
        cx={width}
        cy={Number(points.split(" ").at(-1)?.split(",")[1] ?? height / 2)}
        r="1.8"
        fill="currentColor"
      />
    </svg>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: number;
  icon?: ReactNode;
  spark?: number[];
  tone?: "primary" | "success" | "warning" | "muted";
}

function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) {
    return (
      <Badge variant="outline">
        <MinusIcon aria-hidden="true" />
        0%
      </Badge>
    );
  }
  const positive = trend > 0;
  return (
    <Badge variant={positive ? "success-light" : "destructive-light"}>
      {positive ? (
        <ArrowUpRightIcon aria-hidden="true" />
      ) : (
        <ArrowDownRightIcon aria-hidden="true" />
      )}
      {Math.abs(trend).toFixed(1)}%
    </Badge>
  );
}

export function KpiCard({ label, value, detail, trend, icon, spark, tone = "primary" }: KpiCardProps) {
  return (
    <Frame spacing="sm" className="min-w-0">
      <FramePanel className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-mono truncate text-2xl font-semibold tracking-tight">{value}</span>
          </div>
          {icon ? (
            <IconTile
              variant="outline"
              size="sm"
              className="border-0 bg-muted dark:bg-muted"
              aria-hidden="true"
            >
              {icon}
            </IconTile>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {typeof trend === "number" ? <TrendBadge trend={trend} /> : null}
            {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
          </div>
          {spark ? <Sparkline values={spark} tone={tone} /> : null}
        </div>
      </FramePanel>
    </Frame>
  );
}

export function KpiGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2",
        columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}
