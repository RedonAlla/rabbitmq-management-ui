import { useCallback, useMemo, useState } from "react"
import {
  BoxesIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useRoute, routeHref } from "@/lib/router"
import { TagBadge } from "@/components/badges"
import type { Vhost } from "@/data/types"
import { useVhosts } from "@/hooks/use-vhosts"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { ServerSideTable, fitMeta } from "@/components/table"
import { ClusterStateBadge, DeleteVhostDialog } from "@/components/features/vhosts/details"

const MAX_VISIBLE_TAGS = 2

export function VhostsView() {
  const { navigate } = useRoute()
  const { openDialog } = useDialogs()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [pendingDelete, setPendingDelete] = useState<Vhost | null>(null)

  const listQuery = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      sorting,
    }),
    [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting]
  )

  const { vhosts, filteredCount, pageCount, loading, error, retry } =
    useVhosts(listQuery)

  const resetPage = useCallback(() => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
    )
  }, [])

  const handleSearch = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const clearFilters = () => {
    setSearch("")
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

  const columns = useMemo<ColumnDef<DataGridFeatures, Vhost>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <span className="data-cell font-medium">{row.original.name}</span>
        ),
        meta: { fillWidth: true },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => (
          <span className="block max-w-72 truncate text-sm text-muted-foreground">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "defaultQueueType",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Default queue type" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.defaultQueueType}</Badge>
        ),
        meta: fitMeta,
      },
      {
        accessorKey: "protectedFromDeletion",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Protected" />
        ),
        cell: ({ row }) =>
          row.original.protectedFromDeletion ? (
            <Badge variant="warning-light">Protected</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
        meta: fitMeta,
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
        meta: fitMeta,
      },
      {
        accessorKey: "tags",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Tags" />
        ),
        cell: ({ row }) => {
          const tags = row.original.tags
          if (!tags.length) {
            return (
              <span className="text-xs text-muted-foreground">None</span>
            )
          }
          const visible = tags.slice(0, MAX_VISIBLE_TAGS)
          const hidden = tags.length - visible.length
          return (
            <div className="flex flex-wrap items-center gap-1">
              {visible.map((tag) => (
                <TagBadge key={tag}>{tag}</TagBadge>
              ))}
              {hidden > 0 ? (
                <Badge variant="outline">+{hidden}</Badge>
              ) : null}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        id: "clusterState",
        accessorFn: (vhost) => Object.values(vhost.clusterState).join(","),
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Cluster state" />
        ),
        cell: ({ row }) => (
          <ClusterStateBadge state={row.original.clusterState} />
        ),
        enableSorting: false,
        meta: fitMeta,
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
                  onClick={() =>
                    openDialog({ type: "edit-vhost", vhost: row.original })
                  }
                >
                  <PencilIcon aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        meta: fitMeta,
      },
    ],
    [openDialog]
  )

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

      <ServerSideTable
        isLoading={loading}
        data={vhosts}
        columns={columns}
        totalCount={filteredCount}
        pageCount={pageCount}
        state={{ pagination, sorting }}
        emptyState={{
          icon: <BoxesIcon />,
          title: "No virtual hosts match",
          description:
            "Adjust the search or create a new namespace to get started.",
          action: (
            <Button variant="outline" size="sm" onClick={() => clearFilters()}>
              Clear filters
            </Button>
          ),
        }}
        error={{ message: error, retry }}
        actions={
          <FilterBar
            search={search}
            onSearch={handleSearch}
            placeholder="Search virtual hosts by name"
            className="justify-end"
          />
        }
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onRowClick={(row: Vhost) => navigate(routeHref("vhost", row.name))}
      />

      <DeleteVhostDialog pendingDelete={pendingDelete} setPendingDelete={setPendingDelete} />
    </div>
  )
}
