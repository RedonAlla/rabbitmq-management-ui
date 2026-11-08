import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { ConnectionStateBadge, TlsBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtRate, fmtSince, fmtInt } from "@/lib/format";
import { filterRows, matchesText } from "@/lib/filtering";
import type { Connection } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Skeleton } from "@/components/ui/skeleton";
import GridActions from "./connections/grid-actions";
import { numericMeta } from "@/components/table-meta-numeric";
import GridEmptyState from "./connections/grid-empty-state";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";

export function ConnectionsView() {
  const { data, status, error, actions } = useCluster();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [pendingClose, setPendingClose] = useState<Connection | null>(null);

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
  }
  
  const connections = useMemo(
    () =>
      filterRows(
        data.connections.filter(
          (connection) =>
            matchesText(connection.name, search) || matchesText(connection.user, search)
        ),
        query,
        {
          vhost: (connection) => connection.vhost,
          protocol: (connection) => connection.protocol,
        }
      ),
    [data.connections, search, query]
  );

  const filterFields = useMemo<FilterField[]>(
    () => [
      {
        id: "vhost",
        label: "Virtual host",
        type: "select",
        options: data.vhosts.map((entry) => ({ value: entry.name, label: entry.name })),
      },
      {
        id: "protocol",
        label: "Protocol",
        type: "select",
        options: [
          { value: "AMQP 0-9-1", label: "AMQP 0-9-1" },
          { value: "HTTP", label: "HTTP" },
        ],
      },
    ],
    [data.vhosts]
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
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-48" /> },
      },
      {
        accessorKey: "user",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => <DataGridColumnHeader title="Virtual host" column={column} />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.vhost}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-16" /> },
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader title="State" column={column} />,
        cell: ({ row }) => <ConnectionStateBadge state={row.original.state} />,
        meta: { skeleton: <Skeleton className="h-5 w-16" /> },
      },
      {
        accessorKey: "node",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Node" />,
        cell: ({ row }) => (
          <span className="data-cell text-xs">{row.original.node}</span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "channels",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Channels" />,
        cell: ({ row }) => <span className="data-cell">{row.original.channels}</span>,
        meta: numericMeta,
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
        meta: numericMeta,
      },
      {
        accessorKey: "sendRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Send" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.sendRate)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "connectedAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Connected" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {fmtSince(row.original.connectedAt, new Date().getTime())}
          </span>
        ),
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (<GridActions row={row.original} setPendingClose={setPendingClose} />),
        meta: { skeleton: <Skeleton className="h-4 w-10" /> },
      },
    ],
    []
  );

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: connections,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

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

      <DataGrid
        table={table}
        recordCount={connections.length}
        isLoading={status === "loading"}
        onRowClick={(connection: Connection) => navigate(routeHref("connection", connection.id))}
        emptyMessage={
          <GridEmptyState 
            errorMessage={error}
            retry={actions.retry}
            clearFilters={clearFilters}
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
        tableClassNames={{ base: "min-w-[900px]" }}
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search connections"
              className="justify-end"
            >
              <Filters
                fields={filterFields}
                query={query}
                onQueryChange={setQuery}
                size="sm"
                showClear
              />
            </FilterBar>
          </FrameHeader>
          <FramePanel>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>
          <FrameFooter>
            <DataGridPagination sizes={DEFAULT_PAGES_OPTIONS} />
          </FrameFooter>
        </Frame>
      </DataGrid>

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
