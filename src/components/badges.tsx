import { Badge } from "@/components/reui/badge"
import type {
  ExchangeType,
  QueueState,
  QueueType,
} from "@/data/types"

export function StateBadge({ state }: { state: QueueState | string }) {
  if (state === "running") return <Badge variant="success-light">Running</Badge>
  if (state === "degraded")
    return <Badge variant="warning-light">Degraded</Badge>
  if (state === "idle") return <Badge variant="outline">Idle</Badge>
  if (state === "closed")
    return <Badge variant="destructive-light">Closed</Badge>
  return <Badge variant="outline">{state}</Badge>
}

export function TypeBadge({
  type,
}: {
  type: QueueType | ExchangeType | string
}) {
  return <Badge variant="outline">{type || "default"}</Badge>
}

export function TagBadge({ children }: { children: string }) {
  return <Badge variant="outline">{children}</Badge>
}

export function VhostBadge({ children }: { children: string }) {
  return <Badge variant="outline">{children}</Badge>
}

export function TlsBadge({ ssl }: { ssl: boolean }) {
  if (!ssl) return <Badge variant="outline">Plain</Badge>
  return <Badge variant="success-light">TLS</Badge>
}

export function ConnectionStateBadge({
  state,
}: {
  state: string //"running" | "blocked" | "blocking" | "closed"
}) {
  switch (state) {
    case "running":
      return <Badge variant="success-light">running</Badge>
    case "blocked":
      return <Badge variant="destructive-light">blocked</Badge>
    case "blocking":
      return <Badge variant="warning-light">blocking</Badge>
    default:
      return <Badge variant="outline">closed</Badge>
  }
}
