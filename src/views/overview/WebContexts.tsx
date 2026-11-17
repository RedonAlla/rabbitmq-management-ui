import { GlobeIcon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { SectionFrame } from "@/components/detail"
import { RegionEmpty, RegionSkeleton } from "@/components/region-states"
import { TlsBadge } from "@/components/badges"
import type { WebContext } from "@/data/types"

type Props = {
  contexts: WebContext[]
  loading: boolean
  onRetry: () => void
}

export default function WebContexts({ contexts, loading, onRetry }: Props) {
  return (
    <SectionFrame
      title="Web contexts"
      description="HTTP and WebSocket paths served by the broker plugins."
      actions={
        <Badge variant="outline">
          {contexts.length} {contexts.length === 1 ? "context" : "contexts"}
        </Badge>
      }
    >
      {loading ? (
        <RegionSkeleton rows={4} />
      ) : contexts.length === 0 ? (
        <RegionEmpty
          title="No web contexts"
          description="No HTTP or WebSocket paths are registered on this cluster."
          icon={<GlobeIcon />}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {contexts.map((context) => (
            <div
              key={`${context.node}-${context.port}-${context.path}`}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <IconTile variant="outline" size="xs" aria-hidden="true">
                <GlobeIcon />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {context.description}
                  </span>
                  <TlsBadge ssl={context.tls} />
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  <span className="data-cell">{context.path}</span> ·{" "}
                  {context.node.replace("rabbit@", "")}:
                  <span className="data-cell">{context.port}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionFrame>
  )
}
