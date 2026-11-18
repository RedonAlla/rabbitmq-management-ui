import { FactPanel, type Fact } from "@/components/detail"
import { fmtInt } from "@/lib/format"

export function UserLimitsPanel({
  limits,
}: {
  limits: Record<string, Record<string, number>>
}) {
  const facts: Fact[] = Object.entries(limits).map(([vhost, values]) => {
    const pairs = Object.entries(values)
    return {
      label: vhost,
      value: pairs.length
        ? pairs.map(([key, value]) => `${key} ${fmtInt(value)}`).join(" · ")
        : "No limits",
      mono: true,
    }
  })

  if (!facts.length) {
    facts.push({ label: "Limits", value: "No limits configured" })
  }

  return <FactPanel title="Limits" facts={facts} />
}
