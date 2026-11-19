import { useState } from "react"
import { GlobeIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SectionFrame } from "@/components/detail"
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
import { useVhostPermissions } from "@/hooks/use-vhost-permissions"
import { routeHref } from "@/lib/router"
import { useCluster } from "@/store/cluster"
import type { VhostPermission } from "@/lib/rabbit-api"

export function VhostPermissionsFrame({ vhost }: { vhost: string }) {
  const { permissions, loading, error, retry } = useVhostPermissions(vhost)
  const { actions } = useCluster()
  const [removing, setRemoving] = useState<VhostPermission | null>(null)

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
      >
        <ConditionalRender
          condition={entries.length > 0}
          default={
            <RegionEmpty
              title="No permissions"
              description="No user can configure, write to or read this virtual host yet. Grant permissions from a user's detail page."
              icon={<GlobeIcon />}
              action={
                <Button
                  nativeButton={false}
                  render={<a href={routeHref("users")} />}
                >
                  <UsersIcon data-icon="inline-start" aria-hidden="true" />
                  Manage users
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
              {entries.map((permission) => (
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
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      aria-label={`Remove permissions for ${permission.user}`}
                      onClick={() => setRemoving(permission)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </>
  )
}
