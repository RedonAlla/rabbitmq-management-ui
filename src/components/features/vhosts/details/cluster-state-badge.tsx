import { Badge } from "@/components/reui/badge"


export function ClusterStateBadge({ state }: { state: Record<string, string> }) {
  const entries = Object.entries(state)
  if (!entries.length) return <Badge variant="outline">Unknown</Badge>

  const title = entries.map(([node, value]) => `${node}: ${value}`).join("\n")
  const stopped = entries.some(([, value]) =>
    ["stopped", "down", "unknown"].includes(value)
  )
  const partitioned = entries.some(([, value]) => value === "partitioned")

  const [primaryNode] = entries[0]
  const extraNodes = entries.length - 1

  let label = "Running"
  let variant: "success-light" | "warning-light" | "destructive-light" =
    "success-light"
  if (partitioned) {
    label = "Partitioned"
    variant = "destructive-light"
  } else if (stopped) {
    label = "Stopped"
    variant = "destructive-light"
  } else if (!entries.every(([, value]) => value === "running")) {
    label = "Degraded"
    variant = "warning-light"
  }

  return (
    <div className="flex items-center gap-1.5" title={title}>
      <span className="max-w-40 truncate text-xs text-muted-foreground">
        {primaryNode}
        {extraNodes > 0 ? ` +${extraNodes}` : ""}
      </span>
      <Badge variant={variant}>{label}</Badge>
    </div>
  )
}