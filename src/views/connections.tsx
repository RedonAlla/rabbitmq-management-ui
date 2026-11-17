import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { ConnectionStateBadge, TlsBadge, VhostBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useRoute, routeHref } from "@/lib/router"
import { fmtRate, fmtSince, fmtInt } from "@/lib/format"
import type { Connection } from "@/data/types"
import { useConnections } from "@/hooks/use-connections"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import GridActions from "./connections/grid-actions"
import { fitMeta, numericMeta } from "@/components/table"
import { DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { Plug } from "lucide-react"
import GridEmptyState from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CONNECTIONS_PAGE_SIZE = 100

export function ConnectionsView() {
  const { navigate } = useRoute()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: CONNECTIONS_PAGE_SIZE,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: true },
  ])
  const [pendingClose, setPendingClose] = useState<Connection | null>(null)
  const [closeReason, setCloseReason] = useState("")

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
    connections,
    totalCount,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
    closeConnection,
  } = useConnections(query)

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

  const columns = useMemo<ColumnDef<DataGridFeatures, Connection>[]>(() => {
    const list: ColumnDef<DataGridFeatures, Connection>[] = [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Connection" />
        ),
        cell: ({ row }) => {
          const providedName = row.original.userProvidedName
          return (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-medium">{row.original.name}</span>
              {providedName && providedName !== row.original.name ? (
                <span className="truncate text-xs text-muted-foreground">
                  {providedName}
                </span>
              ) : null}
            </div>
          )
        },
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
        accessorKey: "vhost",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Virtual Host" />
        ),
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
        meta: fitMeta,
      },
      {
        accessorKey: "state",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="State" />
        ),
        cell: ({ row }) => <ConnectionStateBadge state={row.original.state} />,
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
        accessorKey: "protocol",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Protocol" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{row.original.protocol}</span>
              <TlsBadge ssl={row.original.ssl} />
            </div>
          </div>
        ),
        meta: fitMeta,
      },
      {
        accessorKey: "channels",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Channels" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{row.original.channels}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "recvRate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Recv" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtRate(row.original.recvRate)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "sendRate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Sent" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtRate(row.original.sendRate)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "connectedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Connected" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {fmtSince(row.original.connectedAt, new Date().getTime())}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "client",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Client" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs">{row.original.client}</span>
            {row.original.clientVersion ? (
              <span className="truncate text-xs text-muted-foreground">
                {row.original.clientVersion}
              </span>
            ) : null}
          </div>
        ),
        meta: fitMeta,
      },
    ]

    list.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <GridActions row={row.original} setPendingClose={setPendingClose} />
      ),
      meta: fitMeta,
    })

    return list
  }, [])

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: connections,
    columns,
    manualPagination: true,
    manualSorting: true,
    autoResetPageIndex: false,
    pageCount,
    rowCount: filteredCount,
    state: { pagination, sorting },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
  })

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Connections"
        description="Open AMQP and HTTP connections across the cluster."
        actions={
          <Badge variant="outline">{fmtInt(totalCount)} connections</Badge>
        }
      />

      <DataGrid
        table={table}
        recordCount={filteredCount}
        isLoading={loading}
        onRowClick={(connection: Connection) =>
          navigate(routeHref("connection", connection.id))
        }
        emptyMessage={
          <GridEmptyState
            icon={<Plug />}
            error={error}
            retry={retry}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearFilters()}
              >
                Clear filters
              </Button>
            }
            title="No connections match"
            description="No client matches this search. Clear the filters to see every open socket."
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
              placeholder="Search connections by name"
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
        onOpenChange={(open) => {
          if (open) return
          setPendingClose(null)
          setCloseReason("")
        }}
        title="Close connection?"
        description={`${pendingClose?.name ?? "This connection"} and its ${pendingClose?.channels ?? 0} channels will be closed. Attached consumers stop receiving messages.`}
        confirmLabel="Close connection"
        tone="destructive"
        onConfirm={() => {
          if (!pendingClose) return
          const connection = pendingClose
          const reason = closeReason
          setPendingClose(null)
          setCloseReason("")
          closeConnection(connection, reason)
            .then(() => {
              toast.success("Connection closed", {
                description: `${connection.name} was closed.`,
              })
            })
            .catch((cause: unknown) => {
              toast.error("Connection was not closed", {
                description:
                  cause instanceof Error
                    ? cause.message
                    : "The management API did not respond.",
              })
            })
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="close-reason">Reason</Label>
          <Textarea
            id="close-reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            placeholder="Why is this connection being closed? (optional)"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
