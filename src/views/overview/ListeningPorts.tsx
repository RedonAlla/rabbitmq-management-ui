import { NetworkIcon } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { SectionFrame } from "@/components/detail";
import { RegionEmpty, RegionSkeleton } from "@/components/region-states";
import { TlsBadge } from "@/components/badges";
import { fmtAgo } from "@/lib/format";
import type { PortInfo } from "@/data/types";

type Props = {
  ports: PortInfo[];
  loading: boolean;
  updated: number;
  onRetry: () => void;
};

export default function ListeningPorts({ ports, loading, updated, onRetry }: Props) {
  return (
    <SectionFrame
      title="Listening ports"
      description={
        loading
          ? "Protocol listeners exposed by the cluster."
          : `Protocol listeners exposed by the cluster · updated ${fmtAgo(updated, new Date().getTime())}`
      }
      actions={
        <Badge variant="outline">
          {ports.length} {ports.length === 1 ? "port" : "ports"}
        </Badge>
      }
    >
      {loading ? (
        <RegionSkeleton rows={5} />
      ) : ports.length === 0 ? (
        <RegionEmpty
          title="No listeners reported"
          description="No protocol ports were returned for this cluster."
          icon={<NetworkIcon />}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {ports.map((port) => (
            <div key={port.port} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span className="data-cell w-14 shrink-0 text-sm font-medium">{port.port}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm">{port.protocol}</span>
                <span className="truncate text-xs text-muted-foreground">{port.context}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {port.nodes} {port.nodes === 1 ? "node" : "nodes"}
              </span>
              <TlsBadge ssl={port.tls} />
            </div>
          ))}
        </div>
      )}
    </SectionFrame>
  );
}
