import { useState } from "react"
import { GlobeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SectionFrame } from "@/components/detail"
import { EditUserPermissionDialog } from "@/components/features/users/details"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConditionalRender } from "@/components/conditional-render"
import { FilterBar } from "@/components/filters-bar"
import { GrantVhostPermissionDialog } from "./grant-permission-dialog"
import { useVhostPermissions } from "@/hooks/use-vhost-permissions"
import { useCluster } from "@/store/cluster"
import type { VhostPermission } from "@/lib/rabbit-api"

export function VhostPermissionsFrame({ vhost }: { vhost: string }) {
  const { permissions, loading, error, retry } = useVhostPermissions(vhost)
  const { data, actions } = useCluster()
  const [removing, setRemoving] = useState<VhostPermission | null>(null)
  const [editing, setEditing] = useState<VhostPermission | null>(null)
  const [granting, setGranting] = useState(false)
  const [query, setQuery] = useState("")

  if (loading) {
    return (
      <SectionFrame title="Permissions">
        <RegionSkeleton rows={3} />
      </SectionFrame>
    )
  }

  if (error) {
    return (
      <SectionFrame title="Permissions">
        <RegionError message={error} onRetry={retry} />
      </SectionFrame>
    )
  }

  const entries = permissions ?? []
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? entries.filter((permission) =>
        permission.user.toLowerCase().includes(needle)
      )
    : entries
  const grantable = entries.map((permission) => permission.user)
  const candidates = data.users.filter(
    (user) => !grantable.includes(user.username)
  )

  return (
    <>
      <SectionFrame
        title="Permissions"
        description={
          entries.length === 0
            ? "No users are granted access to this virtual host."
            : `${entries.length} user ${
                entries.length === 1 ? "permission grants" : "permissions grant"
              } configure, write and read access.`
        }
        bodyClassName={entries.length ? "p-0" : undefined}
        actions={
          <>
            <ConditionalRender condition={entries.length > 0}>
              <FilterBar
                search={query}
                onSearch={setQuery}
                placeholder="Filter by user…"
                className="w-40 sm:w-52"
              />
            </ConditionalRender>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Grant permission"
              disabled={!candidates.length}
              onClick={() => setGranting(true)}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </>
        }
      >
        <ConditionalRender
          condition={entries.length > 0}
          default={
            <RegionEmpty
              title="No permissions"
              description="No user can configure, write to or read this virtual host yet."
              icon={<GlobeIcon />}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Grant permission"
                  disabled={!candidates.length}
                  onClick={() => setGranting(true)}
                >
                  <PlusIcon aria-hidden="true" />
                </Button>
              }
            />
          }
        >
          <div className="flex min-w-0 flex-col">
            <ConditionalRender
              condition={visible.length > 0}
              default={
                <RegionEmpty
                  title="No matching users"
                  description={`No permission on this virtual host matches "${query}".`}
                  icon={<GlobeIcon />}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery("")}
                    >
                      Clear filter
                    </Button>
                  }
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Configure</TableHead>
                    <TableHead>Write</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead className="w-px text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((permission) => (
                    <TableRow key={permission.user}>
                      <TableCell className="data-cell font-medium">
                        {permission.user}
                      </TableCell>
                      <TableCell className="data-cell text-xs text-muted-foreground">
                        {permission.configure || "(empty)"}
                      </TableCell>
                      <TableCell className="data-cell text-xs text-muted-foreground">
                        {permission.write || "(empty)"}
                      </TableCell>
                      <TableCell className="data-cell text-xs text-muted-foreground">
                        {permission.read || "(empty)"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Edit permissions for ${permission.user}`}
                            onClick={() => setEditing(permission)}
                          >
                            <PencilIcon aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-xs"
                            aria-label={`Remove permissions for ${permission.user}`}
                            onClick={() => setRemoving(permission)}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ConditionalRender>
          </div>
        </ConditionalRender>
      </SectionFrame>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Remove permission?"
        description={`${removing?.user ?? "This user"} immediately loses configure, write and read access to ${vhost}. Connections on this virtual host are not affected.`}
        confirmLabel="Remove permission"
        tone="destructive"
        onConfirm={async () => {
          const target = removing
          setRemoving(null)
          if (!target) return
          try {
            await actions.deleteUserPermission(vhost, target.user)
            retry()
            toast.success("Permission removed", {
              description: `${target.user} no longer has access to ${vhost}.`,
            })
          } catch (cause) {
            toast.error("Permission was not removed", {
              description:
                cause instanceof Error
                  ? cause.message
                  : "The management API did not respond.",
            })
          }
        }}
      />

      <EditUserPermissionDialog
        key={editing?.user ?? "edit-permission"}
        open={editing !== null}
        username={editing?.user ?? ""}
        permission={editing}
        onSaved={retry}
        onClose={() => setEditing(null)}
      />

      <GrantVhostPermissionDialog
        open={granting}
        vhost={vhost}
        grantedUsers={grantable}
        onSaved={retry}
        onClose={() => setGranting(false)}
      />
    </>
  )
}
