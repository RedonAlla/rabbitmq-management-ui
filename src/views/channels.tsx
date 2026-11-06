import { useCallback, useMemo, useState } from "react";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
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
import { StateBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtRate } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Channel } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

export function ChannelsView() {
  const { data, status, error, actions } = useCluster();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [vhost, setVhost] = useState("all");
  const [pendingClose, setPendingClose] = useState<Channel | null>(null);

  const connectionName = useCallback(
    (id: string) =>
      data.connections.find((connection) => connection.id === id)?.name ?? id,
    [data.connections]
  );

  const channels = useMemo(
    () =>
      data.channels.filter(
        (channel) =>
          (matchesText(channel.id, search) || matchesText(connectionName(channel.connection), search)) &&
          (vhost === "all" || channel.vhost === vhost)
      ),
    [data.channels, search, vhost, connectionName]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Channel>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Channel" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="data-cell font-medium">{row.original.id}</span>
            <span className="text-xs text-muted-foreground">
              {connectionName(row.original.connection)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
      },
      {
        accessorKey: "user",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Vhost" />,
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
      },
      {
        accessorKey: "prefetch",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Prefetch" />,
        cell: ({ row }) => (
          <span className="data-cell">
            {row.original.prefetch === 0 ? "∞" : row.original.prefetch}
          </span>
        ),
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{row.original.consumers}</span>,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{row.original.unacked}</span>,
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Publish" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.publishRate)}</span>,
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deliver" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>,
      },
      {
        id: "mode",
        header: () => <span>Mode</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.confirmMode ? <Badge variant="info-light">Confirm</Badge> : null}
            {row.original.transactional ? <Badge variant="warning-light">Tx</Badge> : null}
            {!row.original.confirmMode && !row.original.transactional ? (
              <Badge variant="outline">Plain</Badge>
            ) : null}
          </div>
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
                    aria-label={`Actions for channel ${row.original.id}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setPendingClose(row.original)}
                >
                  <XIcon aria-hidden="true" />
                  Close channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [connectionName]
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Channels"
        description="Channel-level prefetch, consumers and message flow."
        actions={
          <Badge variant="outline">
            {data.channels.length} channels · {data.consumers.length} consumers
          </Badge>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search channels or connections…">
        <SelectFilter
          value={vhost}
          onChange={setVhost}
          options={data.vhosts.map((entry) => ({ value: entry.name, label: entry.name }))}
          label="Filter by virtual host"
          allLabel="All virtual hosts"
        />
      </FilterBar>

      <ResourceTable
        data={channels}
        columns={columns}
        noun="channels"
        minWidth="min-w-[1040px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        onRowClick={(channel) => navigate(routeHref("channel", channel.id))}
        empty={
          <RegionEmpty
            title="No channels match"
            description="Adjust the filters or open a new connection."
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingClose)}
        onOpenChange={(open) => (open ? undefined : setPendingClose(null))}
        title="Close channel?"
        description={`Channel ${pendingClose?.id ?? ""} will be closed. Its consumers stop receiving messages and unacked deliveries are requeued.`}
        confirmLabel="Close channel"
        tone="destructive"
        onConfirm={() => {
          if (!pendingClose) return;
          actions.closeChannel(pendingClose.id);
          toast.success("Channel closed", { description: `Channel ${pendingClose.id} was closed.` });
          setPendingClose(null);
        }}
      />
    </div>
  );
}
