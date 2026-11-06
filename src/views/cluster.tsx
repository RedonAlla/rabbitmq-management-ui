import { useMemo, useState, type FormEvent } from "react";
import { ServerIcon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty, RegionError } from "@/components/region-states";
import { FactPanel, SectionFrame } from "@/components/detail";
import { TlsBadge } from "@/components/badges";
import { useCluster } from "@/store/cluster";
import { fmtAgo, fmtDate, fmtDuration, fmtInt, pct } from "@/lib/format";
import type { NodeInfo, PortInfo } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

export function ClusterView() {
  const { data, status, error, actions } = useCluster();
  const [name, setName] = useState(data.cluster.name);
  const [nameError, setNameError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setNameError("Enter a cluster name.");
    if (clean === data.cluster.name) return setNameError("Enter a different name to save.");
    actions.renameCluster(clean);
    setName(clean);
    setNameError("");
    toast.success("Cluster renamed", { description: `Clients now see ${clean} in server properties.` });
  };

  const nodeColumns = useMemo<ColumnDef<DataGridFeatures, NodeInfo>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Node" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{row.original.name.replace("rabbit@", "")}</span>
            <Badge variant="outline">{row.original.type}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "uptime",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Uptime" />,
        cell: ({ row }) => <span className="data-cell">{fmtDuration(row.original.uptime)}</span>,
      },
      {
        id: "memory",
        header: () => <span>Memory</span>,
        cell: ({ row }) => {
          const usage = pct(row.original.memory, row.original.memoryMax);
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {row.original.memory.toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">
                    / {row.original.memoryMax.toFixed(1)} GB
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{usage.toFixed(0)}%</span>
              </div>
              <Progress value={usage} aria-label={`Memory usage on ${row.original.name}`} />
            </div>
          );
        },
      },
      {
        id: "disk",
        header: () => <span>Disk</span>,
        cell: ({ row }) => {
          const usage = pct(row.original.diskMax - row.original.diskFree, row.original.diskMax);
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {row.original.diskFree.toFixed(1)}{" "}
                  <span className="text-xs text-muted-foreground">GB free</span>
                </span>
                <span className="text-xs text-muted-foreground">{usage.toFixed(0)}% used</span>
              </div>
              <Progress value={usage} aria-label={`Disk usage on ${row.original.name}`} />
            </div>
          );
        },
      },
      {
        accessorKey: "fd",
        header: ({ column }) => <DataGridColumnHeader column={column} title="File descriptors" />,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.fd)}{" "}
            <span className="text-xs text-muted-foreground">/ {fmtInt(row.original.fdMax)}</span>
          </span>
        ),
      },
      {
        accessorKey: "cpu",
        header: ({ column }) => <DataGridColumnHeader column={column} title="CPU" />,
        cell: ({ row }) => <span className="data-cell">{row.original.cpu.toFixed(0)}%</span>,
      },
      {
        id: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) =>
          row.original.running ? (
            <Badge variant="success-light">Running</Badge>
          ) : (
            <Badge variant="destructive-light">Stopped</Badge>
          ),
      },
    ],
    []
  );

  const portColumns = useMemo<ColumnDef<DataGridFeatures, PortInfo>[]>(
    () => [
      {
        accessorKey: "port",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Port" />,
        cell: ({ row }) => <span className="data-cell font-medium">{row.original.port}</span>,
      },
      {
        accessorKey: "protocol",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Protocol" />,
        cell: ({ row }) => <span className="text-sm">{row.original.protocol}</span>,
      },
      {
        accessorKey: "tls",
        header: ({ column }) => <DataGridColumnHeader column={column} title="TLS" />,
        cell: ({ row }) => <TlsBadge ssl={row.original.tls} />,
      },
      {
        accessorKey: "nodes",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nodes" />,
        cell: ({ row }) => <span className="data-cell">{row.original.nodes}</span>,
      },
      {
        accessorKey: "context",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Context" />,
        cell: ({ row }) => (
          <span className="data-cell text-xs text-muted-foreground">{row.original.context}</span>
        ),
      },
    ],
    []
  );

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

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <SectionFrame
          title="Cluster name"
          description="Announced to clients in the AMQP server properties before authentication. It is not a secret."
        >
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cluster-name">Name</Label>
              <Input
                id="cluster-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError("");
                }}
                maxLength={255}
                placeholder="qoder-rabbit"
              />
            </div>
            {nameError ? (
              <p className="text-xs text-destructive-foreground" role="alert">
                {nameError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Shovel and federation use this name to identify which clusters a message traversed.
              </p>
            )}
            <div>
              <Button type="submit">Change name</Button>
            </div>
          </form>
        </SectionFrame>

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
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold">Nodes</h2>
            <p className="text-xs text-muted-foreground">Runtime resources per cluster member.</p>
          </div>
          <Badge variant="outline">
            {data.nodes.length} {data.nodes.length === 1 ? "node" : "nodes"}
          </Badge>
        </div>
        <ResourceTable
          data={data.nodes}
          columns={nodeColumns}
          noun="nodes"
          pageSize={10}
          showPagination={false}
          minWidth="min-w-[1040px]"
          loading={status === "loading"}
          empty={
            <RegionEmpty
              title="No nodes reported"
              description="The management API returned no cluster members."
              icon={<ServerIcon />}
              action={
                <Button type="button" variant="outline" size="sm" onClick={actions.retry}>
                  Retry
                </Button>
              }
            />
          }
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold">Listeners</h2>
            <p className="text-xs text-muted-foreground">
              Protocols accepted by the cluster, with their exposed ports.
            </p>
          </div>
          <Badge variant="outline">
            {data.ports.length} {data.ports.length === 1 ? "listener" : "listeners"}
          </Badge>
        </div>
        <ResourceTable
          data={data.ports}
          columns={portColumns}
          noun="listeners"
          pageSize={10}
          showPagination={false}
          minWidth="min-w-[640px]"
          loading={status === "loading"}
          empty={
            <RegionEmpty
              title="No listeners reported"
              description="No protocol ports were returned for this cluster."
              icon={<ServerIcon />}
              action={
                <Button type="button" variant="outline" size="sm" onClick={actions.retry}>
                  Retry
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
