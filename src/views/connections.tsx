import { useMemo, useState } from "react";
import { MoreHorizontalIcon, UnplugIcon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty } from "@/components/region-states";
import { FilterBar, SelectFilter } from "@/components/filters-bar";
import { TlsBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtRate, fmtSince, fmtInt } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Connection } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

export function ConnectionsView() {
  const { data, status, error, actions } = useCluster();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [vhost, setVhost] = useState("all");
  const [protocol, setProtocol] = useState("all");
  const [pendingClose, setPendingClose] = useState<Connection | null>(null);

  const connections = useMemo(
    () =>
      data.connections.filter(
        (connection) =>
          (matchesText(connection.name, search) || matchesText(connection.user, search)) &&
          (vhost === "all" || connection.vhost === vhost) &&
          (protocol === "all" || connection.protocol === protocol)
      ),
    [data.connections, search, vhost, protocol]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Connection>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Connection" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.name}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline">{row.original.id}</Badge>
              <VhostBadge>{row.original.vhost}</VhostBadge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "user",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
      },
      {
        accessorKey: "node",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Node" />,
        cell: ({ row }) => (
          <span className="data-cell text-xs">{row.original.node.replace("rabbit@", "")}</span>
        ),
      },
      {
        accessorKey: "channels",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Channels" />,
        cell: ({ row }) => <span className="data-cell">{row.original.channels}</span>,
      },
      {
        accessorKey: "protocol",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Protocol" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{row.original.protocol}</span>
            <TlsBadge ssl={row.original.ssl} />
          </div>
        ),
      },
      {
        accessorKey: "recvRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Recv" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.recvRate)}</span>,
      },
      {
        accessorKey: "sendRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Send" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.sendRate)}</span>,
      },
      {
        accessorKey: "connectedAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Connected" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {fmtSince(row.original.connectedAt, new Date().getTime())}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Actions for ${row.original.name}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setPendingClose(row.original)}
                >
                  <UnplugIcon aria-hidden="true" />
                  Close connection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Connections"
        description="Open AMQP and HTTP connections across the cluster."
        actions={
          <Badge variant="outline">
            {fmtInt(data.connections.length)} connections · {fmtInt(data.channels.length)} channels
          </Badge>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search connections or users…">
        <SelectFilter
          value={vhost}
          onChange={setVhost}
          options={data.vhosts.map((entry) => ({ value: entry.name, label: entry.name }))}
          label="Filter by virtual host"
          allLabel="All virtual hosts"
        />
        <SelectFilter
          value={protocol}
          onChange={setProtocol}
          options={[
            { value: "AMQP 0-9-1", label: "AMQP 0-9-1" },
            { value: "HTTP", label: "HTTP" },
          ]}
          label="Filter by protocol"
          allLabel="All protocols"
        />
      </FilterBar>

      <ResourceTable
        data={connections}
        columns={columns}
        noun="connections"
        minWidth="min-w-[1040px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        onRowClick={(connection) => navigate(routeHref("connection", connection.id))}
        empty={
          <RegionEmpty
            title="No connections match"
            description="Adjust the filters or wait for a client to reconnect."
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingClose)}
        onOpenChange={(open) => (open ? undefined : setPendingClose(null))}
        title="Close connection?"
        description={`${pendingClose?.name ?? "This connection"} and its ${pendingClose?.channels ?? 0} channels will be closed. Attached consumers stop receiving messages.`}
        confirmLabel="Close connection"
        tone="destructive"
        onConfirm={() => {
          if (!pendingClose) return;
          actions.closeConnection(pendingClose.id);
          toast.success("Connection closed", { description: `${pendingClose.name} was closed.` });
          setPendingClose(null);
        }}
      />
    </div>
  );
}
