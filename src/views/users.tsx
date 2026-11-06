import { useMemo, useState } from "react";
import { MoreHorizontalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty } from "@/components/region-states";
import { FilterBar } from "@/components/filters-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { initials } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { User } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

export function UsersView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  const users = useMemo(
    () =>
      data.users.filter(
        (user) => matchesText(user.username, search) || matchesText(user.tags.join(" "), search)
      ),
    [data.users, search]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, User>[]>(
    () => [
      {
        accessorKey: "username",
        header: ({ column }) => <DataGridColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <IconTile variant="soft" size="xs" radius="full" aria-hidden="true">
              <span className="text-[0.6rem] font-semibold">{initials(row.original.username)}</span>
            </IconTile>
            <span className="truncate font-medium">{row.original.username}</span>
            {row.original.username === "admin" ? <Badge variant="outline">owner</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "tags",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tags" />,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "vhosts",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Virtual hosts" />,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.vhosts.map((vhost) => (
              <Badge key={vhost} variant="outline">
                <span className="text-mono">{vhost}</span>
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "hash",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Password hash" />,
        cell: ({ row }) => (
          <span className="data-cell text-xs text-muted-foreground">{row.original.hash}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Actions for ${row.original.username}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  disabled={row.original.username === "admin"}
                  onClick={() => setPendingDelete(row.original)}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Cluster users, their tags and virtual host permissions."
        actions={
          <Button type="button" onClick={() => openDialog({ type: "add-user" })}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add user
          </Button>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search users or tags…" />

      <ResourceTable
        data={users}
        columns={columns}
        noun="users"
        minWidth="min-w-[760px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        empty={
          <RegionEmpty
            title="No users match"
            description="Adjust the search or create a new user."
            action={
              <Button type="button" size="sm" onClick={() => openDialog({ type: "add-user" })}>
                Add user
              </Button>
            }
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete user?"
        description={`${pendingDelete?.username ?? ""} immediately loses access to ${pendingDelete?.vhosts.join(", ") ?? "the cluster"}. Open connections are not closed.`}
        confirmLabel="Delete user"
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return;
          actions.deleteUser(pendingDelete.username);
          toast.success("User deleted", { description: `${pendingDelete.username} was removed.` });
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
