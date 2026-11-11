import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { StateBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt } from "@/lib/format";
import type { Channel } from "@/data/types";
import { useChannels } from "@/hooks/use-channels";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { numericMeta } from "@/components/table-meta-numeric";
import GridActions from "./channels/grid-actions";
import { DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { GitBranch } from "lucide-react";
import GridEmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const CHANNELS_PAGE_SIZE = 100;

export function ChannelsView() {
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: CHANNELS_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pendingClose, setPendingClose] = useState<Channel | null>(null);

  const query = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      sorting,
    }),
    [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting]
  );

  const {
    channels,
    totalCount,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
    closeChannel,
  } = useChannels(query);

  const resetPage = useCallback(() => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
    );
  }, []);

  const clearFilters = () => {
    setSearch("");
    resetPage();
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting(updater);
      resetPage();
    },
    [resetPage]
  );

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      setPagination((previous) => {
        const next =
          typeof updater === "function" ? updater(previous) : updater;
        if (next.pageSize !== previous.pageSize) {
          return { pageIndex: 0, pageSize: next.pageSize };
        }
        return next;
      });
    },
    []
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Channel>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.id}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.connection}
            </span>
          </div>
        ),
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-48" /> },
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Virtual Host" />,
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
        meta: { skeleton: <Skeleton className="h-5 w-16" /> },
      },
      {
        accessorKey: "user",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "node",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Node" />,
        cell: ({ row }) => (
          <span className="data-cell text-xs">{row.original.node}</span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-24" /> },
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: { skeleton: <Skeleton className="h-5 w-16" /> },
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.consumers)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.unacked)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUncommitted",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Uncommitted" />,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.messagesUncommitted)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUnconfirmed",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unconfirmed" />,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.messagesUnconfirmed)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "acksUncommitted",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Acks uncommitted" />,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.acksUncommitted)}</span>
        ),
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions row={row.original} setPendingClose={setPendingClose} />
        ),
        meta: { skeleton: <Skeleton className="h-4 w-10" /> },
      },
    ],
    []
  );

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: channels,
    columns,
    manualPagination: true,
    manualSorting: true,
    autoResetPageIndex: false,
    pageCount,
    rowCount: filteredCount,
    state: { pagination, sorting },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Channels"
        description="Open AMQP channels with their consumers and message counters."
        actions={
          <Badge variant="outline">{fmtInt(totalCount)} channels</Badge>
        }
      />

      <DataGrid
        table={table}
        recordCount={filteredCount}
        isLoading={loading}
        onRowClick={(channel: Channel) => navigate(routeHref("channel", channel.id))}
        emptyMessage={
          <GridEmptyState
            icon={<GitBranch />}
            error={error}
            title="No channels match"
            description="No channel matches this search. Clear the filters to see every open channel."
            retry={retry}
            action={
              <Button variant="outline" size="sm" onClick={() => clearFilters()}>
                Clear filters
              </Button>
            }
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
        tableClassNames={{ base: "min-w-[1100px]" }}
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <FilterBar
              search={search}
              onSearch={handleSearch}
              placeholder="Search channels by name"
              className="justify-end"
            />
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
          const channel = pendingClose;
          setPendingClose(null);
          closeChannel(channel.id)
            .then(() => {
              toast.success("Channel closed", {
                description: `Channel ${channel.id} was closed.`,
              });
            })
            .catch((cause: unknown) => {
              toast.error("Channel was not closed", {
                description:
                  cause instanceof Error
                    ? cause.message
                    : "The management API did not respond.",
              });
            });
        }}
      />
    </div>
  );
}
