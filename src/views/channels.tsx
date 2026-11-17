import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { StateBadge, VhostBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useRoute, routeHref } from "@/lib/router"
import { fmtInt } from "@/lib/format"
import type { Channel } from "@/data/types"
import { useChannels } from "@/hooks/use-channels"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { fitMeta, numericMeta, ServerSideTable } from "@/components/table"
import GridActions from "./channels/grid-actions"
import { GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import PrefetchColumnHeader from "./channels/prefetch-column-header"

const CHANNELS_PAGE_SIZE = 100

export function ChannelsView() {
  const { navigate } = useRoute()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: CHANNELS_PAGE_SIZE,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [pendingClose, setPendingClose] = useState<Channel | null>(null)

  const query = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      sorting,
    }),
    [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting]
  )

  const {
    channels,
    totalCount,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
    closeChannel,
  } = useChannels(query)

  const resetPage = useCallback(() => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
    )
  }, [])

  const clearFilters = () => {
    setSearch("")
    resetPage()
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    resetPage()
  }

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

  const columns = useMemo<ColumnDef<DataGridFeatures, Channel>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.id}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.connection}
            </span>
          </div>
        ),
        meta: fitMeta,
      },
      {
        accessorKey: "vhost",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Virtual Host" />
        ),
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
        meta: fitMeta,
      },
      {
        accessorKey: "user",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="User" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
        meta: fitMeta,
      },
      {
        accessorKey: "node",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Node" />
        ),
        cell: ({ row }) => (
          <span className="data-cell text-xs">{row.original.node}</span>
        ),
        meta: fitMeta,
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
        accessorKey: "prefetch",
        header: ({ column }) => <PrefetchColumnHeader column={column} />,
        cell: ({ row }) => (
          <span className="data-cell">
            {row.original.prefetch === 0 ? "∞" : fmtInt(row.original.prefetch)}
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
        accessorKey: "messagesUncommitted",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Uncommitted" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.messagesUncommitted)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUnconfirmed",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Unconfirmed" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.messagesUnconfirmed)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "acksUncommitted",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Acks uncommitted" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.acksUncommitted)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions row={row.original} setPendingClose={setPendingClose} />
        ),
        meta: fitMeta,
      },
    ],
    []
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Channels"
        description="Open AMQP channels with their consumers and message counters."
        actions={<Badge variant="outline">{fmtInt(totalCount)} channels</Badge>}
      />

      <ServerSideTable
        isLoading={loading}
        data={channels}
        columns={columns}
        totalCount={filteredCount}
        pageCount={pageCount}
        state={{ pagination, sorting }}
        emptyState={{
          icon: <GitBranch />,
          title: "No channels match",
          description:
            "No channel matches this search. Clear the filters to see every open channel.",
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
            placeholder="Search channels by name"
            className="justify-end"
          />
        }
        onRowClick={(row: Channel) => navigate(routeHref("channel", row.id))}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={Boolean(pendingClose)}
        onOpenChange={(open) => (open ? undefined : setPendingClose(null))}
        title="Close channel?"
        description={`Channel ${pendingClose?.id ?? ""} will be closed. Its consumers stop receiving messages and unacked deliveries are requeued.`}
        confirmLabel="Close channel"
        tone="destructive"
        onConfirm={() => {
          if (!pendingClose) return
          const channel = pendingClose
          setPendingClose(null)
          closeChannel(channel.id)
            .then(() => {
              toast.success("Channel closed", {
                description: `Channel ${channel.id} was closed.`,
              })
            })
            .catch((cause: unknown) => {
              toast.error("Channel was not closed", {
                description:
                  cause instanceof Error
                    ? cause.message
                    : "The management API did not respond.",
              })
            })
        }}
      />
    </div>
  )
}
