import { useCallback, useMemo, useState } from "react"
import { PlusIcon, Users } from "lucide-react"
import { toast } from "sonner"
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { initials } from "@/lib/format"
import type { User } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { useUsers } from "@/hooks/use-users"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { GridActions } from "@/components/features/users/list"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { fitMeta, ServerSideTable } from "@/components/table"
import { Filters } from "@/components/reui/filters/filters"
import {
  createFilterQuery,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query"
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types"

export function UsersView() {
  const { data, actions } = useCluster()
  const { openDialog } = useDialogs()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)

  const conditions = useMemo(() => flattenFilterConditions(query), [query])

  const usernameFilter = useMemo(() => {
    const condition = conditions.find(
      (entry) => entry.field === "username" && !entry.negated
    )
    const value = condition?.values[0]
    return typeof value === "string" && value ? value : undefined
  }, [conditions])

  const {
    users,
    filteredCount,
    pageCount,
    loading,
    error,
    retry,
  } = useUsers({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    username: usernameFilter,
    sorting,
  })

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
        id: "username",
        label: "Username",
        type: "select",
        options: data.users.map((user) => ({
          value: user.username,
          label: user.username,
        })),
      },
    ],
    [data.users]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, User>[]>(
    () => [
      {
        accessorKey: "username",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="User" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <IconTile variant="soft" size="xs" radius="full" aria-hidden="true">
              <span className="text-[0.6rem] font-semibold">
                {initials(row.original.username)}
              </span>
            </IconTile>
            <span className="truncate font-medium">
              {row.original.username}
            </span>
            {row.original.username === "admin" ? (
              <Badge variant="outline">owner</Badge>
            ) : null}
          </div>
        ),
        meta: fitMeta,
      },
      {
        accessorKey: "tags",
        header: () => <span>Tags</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
        meta: fitMeta,
      },
      {
        accessorKey: "vhosts",
        header: () => <span>Virtual hosts</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.vhosts.map((vhost) => (
              <Badge key={vhost} variant="outline">
                <span className="text-mono">{vhost}</span>
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
        meta: fitMeta,
      },
      {
        accessorKey: "hash",
        header: () => <span>Password hash</span>,
        cell: ({ row }) => (
          <span className="data-cell text-xs text-muted-foreground">
            {row.original.hash}
          </span>
        ),
        enableSorting: false,
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
    [openDialog]
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Cluster users, their tags and virtual host permissions."
        actions={
          <Button
            type="button"
            onClick={() => openDialog({ type: "add-user" })}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add user
          </Button>
        }
      />

      <ServerSideTable
        isLoading={loading}
        data={users}
        columns={columns}
        totalCount={filteredCount}
        pageCount={pageCount}
        state={{ pagination, sorting }}
        emptyState={{
          icon: <Users />,
          title: "No users match",
          description:
            "Adjust the search or clear the filters to see every cluster user.",
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
            placeholder="Search users by name"
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
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete user?"
        description={`${pendingDelete?.username ?? ""} immediately loses access to ${pendingDelete?.vhosts.join(", ") ?? "the cluster"}. Open connections are not closed.`}
        confirmLabel="Delete user"
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return
          actions.deleteUser(pendingDelete.username)
          toast.success("User deleted", {
            description: `${pendingDelete.username} was removed.`,
          })
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
