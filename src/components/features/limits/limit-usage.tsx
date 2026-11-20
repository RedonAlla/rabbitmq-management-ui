import { Progress } from "@/components/ui/progress"
import { fmtInt, pct } from "@/lib/format"

export function LimitUsage({
  used,
  max,
  label,
}: {
  used: number
  max: number | null
  label: string
}) {
  if (max === null)
    return <span className="data-cell text-muted-foreground">No limit</span>

  const usage = pct(used, max)
  return (
    <div className="flex w-40 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="data-cell">
          {fmtInt(used)}{" "}
          <span className="text-xs text-muted-foreground">/ {fmtInt(max)}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {usage.toFixed(0)}%
        </span>
      </div>
      <Progress value={usage} aria-label={label} />
    </div>
  )
}
