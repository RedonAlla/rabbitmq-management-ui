import { useCallback, useMemo, useState } from "react"
import {
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
  TriangleExclamationPoint,
} from "lucide-react"
import { toast } from "sonner"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { fmtInt } from "@/lib/format"
import { matchesText } from "@/lib/filtering"
import type { Vhost } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { numericMeta } from "@/components/table"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import GridEmptyState from "@/components/ui/empty-state"

export function VhostsView() {
  const { data, status, error, actions } = useCluster()
  const { openDialog } = useDialogs()
  const [search, setSearch] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Vhost | null>(null)

  const vhosts = useMemo(
    () =>
      data.vhosts.filter(
        (vhost) =>
          matchesText(vhost.name, search) ||
          matchesText(vhost.description, search)
      ),
    [data.vhosts, search]
  )

  const clearFilters = () => {
    setSearch("")
  }

  const counts = useCallback(
    (name: string) => ({
      queues: data.queues.filter((queue) => queue.vhost === name).length,
      exchanges: data.exchanges.filter((exchange) => exchange.vhost === name)
        .length,
      connections: data.connections.filter(
        (connection) => connection.vhost === name
      ).length,
      limit: data.limits.find((limit) => limit.vhost === name),
    }),
    [data.queues, data.exchanges, data.connections, data.limits]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, Vhost>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Virtual host" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="data-cell font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </span>
          </div>
        ),
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        id: "queues",
        header: () => <span>Queues</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(counts(row.original.name).queues)}
            {counts(row.original.name).limit ? (
              <span className="text-xs text-muted-foreground">
                {" "}
                / {fmtInt(counts(row.original.name).limit?.maxQueues ?? 0)}
              </span>
            ) : null}
          </span>
        ),
        meta: numericMeta,
      },
      {
        id: "exchanges",
        header: () => <span>Exchanges</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(counts(row.original.name).exchanges)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        id: "connections",
        header: () => <span>Connections</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(counts(row.original.name).connections)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "tracing",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Tracing" />
        ),
        cell: ({ row }) =>
          row.original.tracing ? (
            <Badge variant="info-light">On</Badge>
          ) : (
            <Badge variant="outline">Off</Badge>
          ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  disabled={row.original.name === "/"}
                  onClick={() => setPendingDelete(row.original)}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [counts]
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: vhosts,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  })

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Virtual hosts"
        description="Isolated namespaces with their own topology and limits."
        actions={
          <Button
            type="button"
            onClick={() => openDialog({ type: "add-vhost" })}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add virtual host
          </Button>
        }
      />

      <DataGrid
        table={table}
        recordCount={vhosts.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<TriangleExclamationPoint />}
            error={error}
            retry={actions.retry}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearFilters()}
              >
                Clear filters
              </Button>
            }
            title="No virtual hosts match"
            description="Adjust the search or create a new namespace."
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
              placeholder="Search queues…"
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
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete virtual host?"
        description={`${pendingDelete?.name ?? ""} is removed with its policies and limits. The cluster refuses the delete while queues, exchanges or connections remain.`}
        confirmLabel="Delete virtual host"
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return
          const used =
            data.queues.some((queue) => queue.vhost === pendingDelete.name) ||
            data.connections.some(
              (connection) => connection.vhost === pendingDelete.name
            ) ||
            data.exchanges.some(
              (exchange) => exchange.vhost === pendingDelete.name
            )
          actions.deleteVhost(pendingDelete.name)
          if (used) {
            toast.error("Virtual host is not empty", {
              description:
                "Remove its queues, exchanges and connections first.",
            })
          } else {
            toast.success("Virtual host deleted", {
              description: `${pendingDelete.name} was removed.`,
            })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
