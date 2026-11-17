import { useCallback, useMemo, useState } from "react"
import { ListOrdered, PlusIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { Filters } from "@/components/reui/filters/filters"
import {
  createFilterQuery,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query"
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types"
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import { fmtBytesMb, fmtInt } from "@/lib/format"
import type { Queue } from "@/data/types"
import { useQueues } from "@/hooks/use-queues"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import GridActions from "./queues/grid-actions"
import QueueFeatures from "./queues/queue-features"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { ServerSideTable, fitMeta, numericMeta } from "@/components/table"
import type { ConfirmState } from "@/components/features/queues/types"
import { QueueConfirmDialog } from "@/components/features/confirm-dialog"

export function QueuesView() {
  const { data } = useCluster()
  const { openDialog } = useDialogs()
  const { navigate } = useRoute()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const conditions = useMemo(() => flattenFilterConditions(query), [query])

  const vhostFilter = useMemo(() => {
    const condition = conditions.find(
      (entry) => entry.field === "vhost" && !entry.negated
    )
    const value = condition?.values[0]
    return typeof value === "string" && value ? value : undefined
  }, [conditions])

  const listQuery = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      vhost: vhostFilter,
      sorting,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      vhostFilter,
      sorting,
    ]
  )

  const {
    queues,
    totalCount,
    pageCount,
    loading,
    error,
    retry,
    purgeQueue,
    deleteQueue,
  } = useQueues(listQuery)

  const resetPage = useCallback(() => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
    )
  }, [])

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
    resetPage()
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const handleQueryChange = useCallback(
    (next: FilterQuery) => {
      setQuery(next)
      resetPage()
    },
    [resetPage]
  )

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting(updater)
      resetPage()
    },
    [resetPage]
  )

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      setPagination((previous) => {
        const next = typeof updater === "function" ? updater(previous) : updater
        if (next.pageSize !== previous.pageSize) {
          return { pageIndex: 0, pageSize: next.pageSize }
        }
        return next
      })
    },
    []
  )

  const filterFields = useMemo<FilterField[]>(
    () => [
      {
        id: "vhost",
        label: "Virtual host",
        type: "select",
        options: data.vhosts.map((entry) => ({
          value: entry.name,
          label: entry.name,
        })),
      },
    ],
    [data.vhosts]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, Queue>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.name}</span>
            <div className="flex items-center gap-1.5">
              <VhostBadge>{row.original.vhost}</VhostBadge>
            </div>
          </div>
        ),
        enableResizing: true,
        meta: fitMeta,
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        meta: fitMeta,
      },
      {
        id: "features",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Features" />
        ),
        cell: ({ row }) => <QueueFeatures queue={row.original} />,
        enableSorting: false,
        meta: fitMeta,
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Consumers" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.consumers)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "state",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="State" />
        ),
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: fitMeta,
      },
      {
        accessorKey: "ready",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ready" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.ready)}
            {row.original.ready > 5000 ? (
              <span
                className="ml-1.5 inline-block size-1.5 rounded-full bg-warning align-middle"
                aria-label="High backlog"
              />
            ) : null}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Unacked" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.unacked)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "memory",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Memory" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtBytesMb(row.original.memory)}</span>
        ),
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions
            rowData={row.original}
            openDialog={openDialog}
            setConfirm={setConfirm}
          />
        ),
        meta: fitMeta,
      },
    ],
    [openDialog]
  )

  const handleQueueCreated = useCallback(() => {
    resetPage()
    retry()
  }, [resetPage, retry])

  const confirmQueue = async () => {
    if (!confirm) return
    const { kind, queue } = confirm
    setConfirm(null)
    try {
      if (kind === "purge") {
        await handlePurgeQueue(queue)
      } else {
        await handleDeleteQueue(queue)
      }
    } catch (cause) {
      toast.error(
        kind === "purge" ? "Queue was not purged" : "Queue was not deleted",
        {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        }
      )
    }
  }

  async function handlePurgeQueue(queue: Queue) {
    await purgeQueue(queue.vhost, queue.name)
    toast.success("Queue purged", {
      description: `${fmtInt(queue.ready)} messages removed from ${queue.name}.`,
    })
  }

  async function handleDeleteQueue(queue: Queue) {
    await deleteQueue(queue.vhost, queue.name)
    toast.success("Queue deleted", {
      description: `${queue.name} was removed.`,
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Queues"
        description="Consumers, delivery state and memory for every queue."
        actions={
          <>
            <Badge variant="outline">{fmtInt(totalCount)} queues</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => openDialog({ type: "publish" })}
            >
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
            <Button
              type="button"
              onClick={() =>
                openDialog({ type: "add-queue", onCreated: handleQueueCreated })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add queue
            </Button>
          </>
        }
      />

      <ServerSideTable
        isLoading={loading}
        data={queues}
        columns={columns}
        totalCount={totalCount}
        pageCount={pageCount}
        state={{ pagination, sorting }}
        emptyState={{
          icon: <ListOrdered />,
          title: "No queues match",
          description:
            "Adjust the search or clear the filters to see every declared queue.",
          action: (
            <Button variant="outline" size="sm" onClick={() => clearFilters()}>
              Clear filters
            </Button>
          ),
        }}
        error={{
          message: error,
          retry,
        }}
        actions={
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
        }
        onRowClick={(row: Queue) => navigate(routeHref("queue", row.name))}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
      />

      <QueueConfirmDialog
        confirm={confirm}
        setConfirm={setConfirm}
        confirmQueue={confirmQueue}
      />
    </div>
  )
}
