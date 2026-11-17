import { useMemo, useState } from "react"
import { PlusIcon, Users } from "lucide-react"
import { toast } from "sonner"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { initials } from "@/lib/format"
import { matchesText } from "@/lib/filtering"
import type { User } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Skeleton } from "@/components/ui/skeleton"
import GridActions from "./user/grid-actions"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import { Filters } from "@/components/reui/filters/filters"
import {
  createFilterQuery,
  flattenFilterConditions,
  type FilterCondition,
} from "@/components/reui/filters/filters-query"
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import GridEmptyState from "@/components/ui/empty-state"

function matchesValues(values: string[], condition: FilterCondition): boolean {
  const selected = condition.values.map(String)
  const pending = selected.length === 0
  const wildcard = values.includes("*")
  let matches: boolean

  switch (condition.operator) {
    case "empty":
      matches = values.length === 0
      break
    case "not_empty":
      matches = values.length > 0
      break
    case "is":
    case "is_any_of":
    case "has_any_of":
      matches =
        pending || wildcard || values.some((value) => selected.includes(value))
      break
    case "is_not":
    case "is_none_of":
    case "has_none_of":
      matches =
        pending ||
        !(wildcard || values.some((value) => selected.includes(value)))
      break
    case "has_all_of":
      matches =
        pending || wildcard || selected.every((value) => values.includes(value))
      break
    default:
      matches = true
  }

  return condition.negated ? !matches : matches
}

export function UsersView() {
  const { data, status, error, actions } = useCluster()
  const { openDialog } = useDialogs()
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)

  const conditions = useMemo(() => flattenFilterConditions(query), [query])

  const users = useMemo(
    () =>
      data.users.filter(
        (user) =>
          (matchesText(user.username, search) ||
            matchesText(user.tags.join(" "), search)) &&
          conditions.every((condition) => {
            if (condition.field === "username")
              return matchesValues([user.username], condition)
            if (condition.field === "vhost")
              return matchesValues(user.vhosts, condition)
            return true
          })
      ),
    [conditions, data.users, search]
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
      {
        id: "vhost",
        label: "Virtual host",
        type: "multiselect",
        options: data.vhosts.map((entry) => ({
          value: entry.name,
          label: entry.name,
        })),
      },
    ],
    [data.users, data.vhosts]
  )

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
  }

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
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "tags",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Tags" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "vhosts",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Virtual hosts" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.vhosts.map((vhost) => (
              <Badge key={vhost} variant="outline">
                <span className="text-mono">{vhost}</span>
              </Badge>
            ))}
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "hash",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Password hash" />
        ),
        cell: ({ row }) => (
          <span className="data-cell text-xs text-muted-foreground">
            {row.original.hash}
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions row={row.original} setPendingDelete={setPendingDelete} />
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: users,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  })

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

      <DataGrid
        table={table}
        recordCount={users.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<Users />}
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
            title="No users match"
            description="No users matches this search."
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
              placeholder="Search users or tags…"
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
