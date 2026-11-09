import { SectionFrame } from "@/components/detail"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RegionEmpty, RegionSkeleton } from "@/components/region-states"
import type { SeedData } from "@/data/types"
import { fmtDuration, pct } from "@/lib/format"
import { ServerIcon } from "lucide-react"

type Props = {
  data: SeedData
  loading: boolean
  onRetry: () => void
}

export default function Nodes({ data, loading, onRetry }: Props) {
  const nodeCount = data.nodes.length

  return (
    <SectionFrame
      title="Cluster nodes"
      description={
        loading && !nodeCount
          ? "Fetching nodes from the broker."
          : nodeCount
            ? `${nodeCount} ${nodeCount === 1 ? "node" : "nodes"} · ${fmtDuration(data.nodes[0].uptime)} uptime`
            : "No nodes reported"
      }
      actions={
        data.cluster.version ? (
          <Badge variant="outline">{data.cluster.version}</Badge>
        ) : null
      }
    >
      {loading && !nodeCount ? (
        <RegionSkeleton rows={2} />
      ) : !nodeCount ? (
        <RegionEmpty
          title="No nodes reported"
          description="The management API did not return any cluster nodes."
          icon={<ServerIcon />}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {data.nodes.map((node) => (
            <div
              key={node.name}
              className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <IconTile variant="outline" size="xs" aria-hidden="true">
                  <ServerIcon />
                </IconTile>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {node.name.replace("rabbit@", "")}
                </span>
                <Badge variant="outline">{node.type}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span className="text-mono">
                  CPU {node.cpu === null ? "n/a" : `${node.cpu.toFixed(0)}%`}
                </span>
                <span className="text-mono">
                  Mem {node.memory.toFixed(2)} GB
                </span>
                <span className="text-mono">{node.sockets} sockets</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={pct(node.memory, node.memoryMax)}
                  aria-label={`${node.name} memory pressure`}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">
                  {pct(node.memory, node.memoryMax).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionFrame>
  )
}
