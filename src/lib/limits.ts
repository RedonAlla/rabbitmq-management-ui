import { pct } from "@/lib/format"

export type LimitStatusVariant =
  "success-light" | "warning-light" | "destructive-light"

export interface LimitStatus {
  label: string
  variant: LimitStatusVariant
  severity: 0 | 1 | 2
}

export function limitStatus(
  used: number,
  max: number | null
): LimitStatus | null {
  if (max === null) return null
  const usage = pct(used, max)
  if (usage >= 100)
    return { label: "At limit", variant: "destructive-light", severity: 2 }
  if (usage >= 80)
    return { label: "Near limit", variant: "warning-light", severity: 1 }
  return { label: "Within limit", variant: "success-light", severity: 0 }
}

export function worstLimitStatus(
  ...statuses: (LimitStatus | null)[]
): LimitStatus | null {
  return statuses.reduce<LimitStatus | null>(
    (worst, status) =>
      status && (!worst || status.severity > worst.severity) ? status : worst,
    null
  )
}
