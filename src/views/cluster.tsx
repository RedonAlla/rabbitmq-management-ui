import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { RegionError } from "@/components/region-states";
import { FactPanel } from "@/components/detail";
import { useCluster } from "@/store/cluster";
import { fmtAgo, fmtDate } from "@/lib/format";
import NodesTable from "./cluster/NodesTable";
import ListenersTable from "./cluster/ListenersTable";

export function ClusterView() {
  const { data, status, error, actions } = useCluster();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Cluster"
        eyebrow={
          <>
            <Badge variant="success-light">Online</Badge>
            <span className="text-xs text-muted-foreground">
              RabbitMQ {data.cluster.version} · Erlang {data.cluster.erlang}
            </span>
          </>
        }
        description="Cluster identity, member resources and the listeners clients connect to."
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <FactPanel
        title="Cluster identity"
        description="Reported by the management API."
        facts={[
          { label: "Cluster", value: data.cluster.name, mono: true },
          { label: "Version", value: data.cluster.version },
          { label: "Erlang", value: data.cluster.erlang },
          { label: "First node", value: data.cluster.node, mono: true },
          {
            label: "Started",
            value: `${fmtDate(data.cluster.startedAt)} · ${fmtAgo(data.cluster.startedAt, new Date().getTime())}`,
          },
          { label: "Members", value: `${data.nodes.length} nodes` },
          { label: "Listeners", value: `${data.ports.length} ports` },
        ]}
      />

      <NodesTable nodes={data.nodes} loading={status === "loading"} error={error} onRetry={actions.retry} />
      <ListenersTable ports={data.ports} loading={status === "loading"} error={error} onRetry={actions.retry} />
    </div>
  );
}
