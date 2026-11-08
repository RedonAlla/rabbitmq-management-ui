import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { StateBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtRate } from "@/lib/format";
import { filterRows, matchesText } from "@/lib/filtering";
import type { Channel } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { numericMeta } from "@/components/table-meta-numeric";
import GridActions from "./channels/grid-actions";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { GitBranch } from "lucide-react";
import GridEmptyState from "@/components/ui/empty-state";

export function ChannelsView() {
  const { data, status, error, actions } = useCluster();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [pendingClose, setPendingClose] = useState<Channel | null>(null);

  const connectionName = useCallback(
    (id: string) =>
      data.connections.find((connection) => connection.id === id)?.name ?? id,
    [data.connections]
  );

  const channels = useMemo(
    () =>
      filterRows(
        data.channels.filter(
          (channel) =>
            matchesText(channel.id, search) ||
            matchesText(connectionName(channel.connection), search)
        ),
        query,
        { vhost: (channel) => channel.vhost }
      ),
    [data.channels, search, query, connectionName]
  );

  const filterFields = useMemo<FilterField[]>(
    () => [
      {
        id: "vhost",
        label: "Virtual host",
        type: "select",
        options: data.vhosts.map((entry) => ({ value: entry.name, label: entry.name })),
      },
    ],
    [data.vhosts]
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
        meta: { skeleton: <Skeleton className="h-4 w-15" /> }
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: { skeleton: <Skeleton className="h-4 w-15" /> }
      },
      {
        accessorKey: "user",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-15" /> }
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Vhost" />,
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
        meta: { skeleton: <Skeleton className="h-4 w-15" /> }
      },
      {
        accessorKey: "prefetch",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Prefetch" />,
        cell: ({ row }) => (
          <span className="data-cell">
            {row.original.prefetch === 0 ? "∞" : row.original.prefetch}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{row.original.consumers}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{row.original.unacked}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Publish" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.publishRate)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deliver" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>,
        meta: numericMeta,
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
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions row={row.original} setPendingClose={setPendingClose} />
        ),
      },
    ],
    [connectionName]
  );

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
  }

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: channels,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

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

      <DataGrid
        table={table}
        recordCount={channels.length}
        isLoading={status === "loading"}
        onRowClick={(channel) => navigate(routeHref("channel", channel.id))}
        emptyMessage={
          <GridEmptyState 
            icon={<GitBranch />}
            error={error}
            title="No channels match"
            description="Adjust the filters or open a new connection."
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
              placeholder="Search channels"
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
