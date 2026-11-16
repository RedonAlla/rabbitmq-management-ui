import { useCallback, useMemo, useState } from "react";
import { ListOrdered, PlusIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { Filters } from "@/components/reui/filters/filters";
import {
  createFilterQuery,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtBytesMb, fmtInt } from "@/lib/format";
import type { Queue } from "@/data/types";
import { useQueues } from "@/hooks/use-queues";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import type { ConfirmState } from "./queues/grid-actions";
import GridActions from "./queues/grid-actions";
import QueueFeatures from "./queues/queue-features";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { fitMeta, numericMeta } from "@/components/table";
import { Skeleton } from "@/components/ui/skeleton";
import GridEmptyState from "@/components/ui/empty-state";

const QUEUES_PAGE_SIZE = 100;

export function QueuesView() {
  const { data } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: QUEUES_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const conditions = useMemo(() => flattenFilterConditions(query), [query]);

  const vhostFilter = useMemo(() => {
    const condition = conditions.find(
      (entry) => entry.field === "vhost" && !entry.negated
    );
    const value = condition?.values[0];
    return typeof value === "string" && value ? value : undefined;
  }, [conditions]);

  const listQuery = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      vhost: vhostFilter,
      sorting,
    }),
    [pagination.pageIndex, pagination.pageSize, debouncedSearch, vhostFilter, sorting]
  );

  const {
    queues,
    totalCount,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
    purgeQueue,
    deleteQueue,
  } = useQueues(listQuery);

  const resetPage = useCallback(() => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
    );
  }, []);

  const clearFilters = () => {
    setSearch("");
    setQuery(createFilterQuery());
    resetPage();
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleQueryChange = useCallback(
    (next: FilterQuery) => {
      setQuery(next);
      resetPage();
    },
    [resetPage]
  );

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

  const columns = useMemo<ColumnDef<DataGridFeatures, Queue>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.name}</span>
            <div className="flex items-center gap-1.5">
              <VhostBadge>{row.original.vhost}</VhostBadge>
            </div>
          </div>
        ),
        enableResizing: true,
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-40" /> }
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Type" />,
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        meta: fitMeta
      },
      {
        id: "features",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Features" />,
        cell: ({ row }) => <QueueFeatures queue={row.original} />,
        enableSorting: false,
        meta: fitMeta
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.consumers)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: fitMeta
      },
      {
        accessorKey: "ready",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ready" />,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.ready)}
            {row.original.ready > 5000 ? (
              <span className="ml-1.5 inline-block size-1.5 rounded-full bg-warning align-middle" aria-label="High backlog" />
            ) : null}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.unacked)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "memory",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Memory" />,
        cell: ({ row }) => <span className="data-cell">{fmtBytesMb(row.original.memory)}</span>,
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (<GridActions rowData={row.original} openDialog={openDialog} setConfirm={setConfirm} />),
        meta: fitMeta
      },
    ],
    [openDialog]
  );

  const handleQueueCreated = useCallback(() => {
    resetPage();
    retry();
  }, [resetPage, retry]);

  const confirmQueue = async () => {
    if (!confirm) return;
    const { kind, queue } = confirm;
    setConfirm(null);
    try {
      if (kind === "purge") {
        await purgeQueue(queue.vhost, queue.name);
        toast.success("Queue purged", {
          description: `${fmtInt(queue.ready)} messages removed from ${queue.name}.`,
        });
      } else {
        await deleteQueue(queue.vhost, queue.name);
        toast.success("Queue deleted", { description: `${queue.name} was removed.` });
      }
    } catch (cause) {
      toast.error(
        kind === "purge" ? "Queue was not purged" : "Queue was not deleted",
        {
          description:
            cause instanceof Error ? cause.message : "The management API did not respond.",
        }
      );
    }
  };

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: queues,
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
        title="Queues"
        description="Consumers, delivery state and memory for every queue."
        actions={
          <>
            <Badge variant="outline">{fmtInt(totalCount)} queues</Badge>
            <Button type="button" variant="outline" onClick={() => openDialog({ type: "publish" })}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
            <Button type="button" onClick={() => openDialog({ type: "add-queue", onCreated: handleQueueCreated })}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add queue
            </Button>
          </>
        }
      />

      <DataGrid
        table={table}
        recordCount={filteredCount}
        isLoading={loading}
        onRowClick={(row: Queue) => navigate(routeHref("queue", row.name))}
        emptyMessage={
          <GridEmptyState
            icon={<ListOrdered />}
            title="No queues match"
            description="Adjust the search or clear the filters to see every declared queue."
            error={error}
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
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <FilterBar
              search={search}
              onSearch={handleSearch}
              placeholder="Search queues by name"
              className="justify-end"
            >
              <Filters
                fields={filterFields}
                query={query}
                onQueryChange={handleQueryChange}
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
        open={Boolean(confirm)}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm?.kind === "purge" ? "Purge queue?" : "Delete queue?"}
        description={
          confirm?.kind === "purge"
            ? `This removes ${fmtInt(confirm.queue.ready)} ready messages from ${confirm.queue.name}. Consumers stay attached.`
            : `This permanently deletes ${confirm?.queue.name ?? ""} with its bindings and consumers.`
        }
        confirmLabel={confirm?.kind === "purge" ? "Purge messages" : "Delete queue"}
        tone={confirm?.kind === "delete" ? "destructive" : "default"}
        onConfirm={confirmQueue}
      />
    </div>
  );
}

