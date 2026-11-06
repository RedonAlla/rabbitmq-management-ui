import { Badge } from "@/components/reui/badge";
import type { ExchangeType, QueueState, QueueType, Stability } from "@/data/types";

export function StateBadge({ state }: { state: QueueState | string }) {
  if (state === "running") return <Badge variant="success-light">Running</Badge>;
  if (state === "degraded") return <Badge variant="warning-light">Degraded</Badge>;
  if (state === "idle") return <Badge variant="outline">Idle</Badge>;
  if (state === "closed") return <Badge variant="destructive-light">Closed</Badge>;
  return <Badge variant="outline">{state}</Badge>;
}

export function TypeBadge({ type }: { type: QueueType | ExchangeType | string }) {
  return <Badge variant="outline">{type || "default"}</Badge>;
}

export function StabilityBadge({ stability }: { stability: Stability }) {
  if (stability === "stable") return <Badge variant="success-light">Stable</Badge>;
  return <Badge variant="warning-light">Experimental</Badge>;
}

export function TagBadge({ children }: { children: string }) {
  return <Badge variant="outline">{children}</Badge>;
}

export function VhostBadge({ children }: { children: string }) {
  return <Badge variant="outline">{children}</Badge>;
}

export function TlsBadge({ ssl }: { ssl: boolean }) {
  if (!ssl) return <Badge variant="outline">Plain</Badge>;
  return <Badge variant="success-light">TLS</Badge>;
}
