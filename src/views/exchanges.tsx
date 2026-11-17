import { useCallback, useMemo, useState } from "react"
import { PlusIcon, SendIcon, Waypoints } from "lucide-react"
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
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import { fmtInt, fmtRate } from "@/lib/format"
import type { Exchange } from "@/data/types"
import { useExchanges } from "@/hooks/use-exchanges"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { fitMeta, numericMeta, ServerSideTable } from "@/components/table"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { GridActions } from "../components/features/exchanges/list"

export function ExchangesView() {
  const { data, actions } = useCluster()
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
  const [pendingDelete, setPendingDelete] = useState<Exchange | null>(null)

  const conditions = useMemo(() => flattenFilterConditions(query), [query])

  const vhostFilter = useMemo(() => {
    const condition = conditions.find(
      (entry) => entry.field === "vhost" && !entry.negated
    )
    const value = condition?.values[0]
    return typeof value === "string" && value ? value : undefined
  }, [conditions])

  const {
    exchanges,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
  } = useExchanges({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    vhost: vhostFilter,
    sorting,
  })

  const bindingCount = useCallback(
    (exchange: Exchange) =>
      data.bindings.filter(
        (binding) =>
          binding.source === exchange.name && binding.vhost === exchange.vhost
      ).length,
    [data.bindings]
  )

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

  const columns = useMemo<ColumnDef<DataGridFeatures, Exchange>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Exchange" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">
                {row.original.name || "(default)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {row.original.internal ? (
                <Badge variant="outline">Internal</Badge>
              ) : null}
              {row.original.durable ? (
                <Badge variant="outline">Durable</Badge>
              ) : null}
            </div>
          </div>
        ),
        meta: fitMeta,
      },
      {
        id: "bindings",
        header: () => <span>Bindings</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(bindingCount(row.original))}
          </span>
        ),
        enableSorting: false,
        meta: numericMeta,
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => (
          <DataGridColumnHeader title="Virtual host" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.vhost}</span>
        ),
        meta: fitMeta,
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataGridColumnHeader title="Type" column={column} />
        ),
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
        meta: fitMeta,
      },
      {
        accessorKey: "publishIn",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Published in" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.publishIn)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="In rate" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtRate(row.original.publishRate)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "publishOut",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Published out" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.publishOut)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Out rate" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "autoDelete",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Auto-delete" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.autoDelete ? "Yes" : "No"}
          </span>
        ),
        meta: fitMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions
            row={row.original}
            setPendingDelete={setPendingDelete}
            openDialog={openDialog}
          />
        ),
        meta: fitMeta,
      },
    ],
    [bindingCount, openDialog]
  )

  async function handleConfirm() {
    if (!pendingDelete) return
    const exchange = pendingDelete
    setPendingDelete(null)
    try {
      await actions.deleteExchange(exchange.vhost, exchange.name)
      toast.success("Exchange deleted", {
        description: `${exchange.name} was removed.`,
      })
    } catch (cause) {
      toast.error("Exchange was not deleted", {
        description:
          cause instanceof Error
            ? cause.message
            : "The management API did not respond.",
      })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Exchanges"
        description="Routing exchanges, binding counts and publish throughput."
        actions={
          <>
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
              onClick={() => openDialog({ type: "add-exchange" })}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add exchange
            </Button>
          </>
        }
      />

      <ServerSideTable
        isLoading={loading}
        data={exchanges}
        columns={columns}
        totalCount={filteredCount}
        pageCount={pageCount}
        state={{ pagination, sorting }}
        emptyState={{
          icon: <Waypoints />,
          title: "No exchanges match",
          description:
            "Adjust the search or clear the filters to see every declared exchange.",
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
            placeholder="Search exchanges by name"
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
        onRowClick={(row: Exchange) => navigate(routeHref("exchange", row.name))}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete exchange?"
        description={`This removes ${pendingDelete?.name ?? ""} and every binding that leaves it. Bound queues keep their messages.`}
        confirmLabel="Delete exchange"
        tone="destructive"
        onConfirm={handleConfirm}
      />
    </div>
  )
}
