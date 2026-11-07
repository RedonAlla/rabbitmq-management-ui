import { SectionFrame } from "@/components/detail";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Progress } from "@/components/ui/progress";
import type { SeedData } from "@/data/types";
import { fmtDuration, pct } from "@/lib/format";
import { ServerIcon } from "lucide-react";

type Props = {
  data: SeedData;
};

export default function Nodes({ data }: Props) {
  return (
    <SectionFrame
      title="Cluster nodes"
      description={`${data.nodes.length} nodes · ${fmtDuration(data.nodes[0].uptime)} uptime`}
      actions={<Badge variant="outline">{data.cluster.version}</Badge>}
    >
      <div className="flex flex-col divide-y divide-border">
        {data.nodes.map((node) => (
          <div key={node.name} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
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
              <span className="text-mono">CPU {node.cpu.toFixed(0)}%</span>
              <span className="text-mono">Mem {node.memory.toFixed(2)} GB</span>
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
    </SectionFrame>
  );
}
