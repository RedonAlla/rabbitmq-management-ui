import { useState } from "react"
import {
  GlobeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
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
import { EditVhostTopicPermissionDialog } from "./edit-topic-permission-dialog"
import { GrantVhostTopicPermissionDialog } from "./grant-topic-permission-dialog"
import { useVhostTopicPermissions } from "@/hooks/use-vhost-topic-permissions"
import { useCluster } from "@/store/cluster"
import type { VhostTopicPermission } from "@/lib/rabbit-api"

export function VhostTopicPermissionsFrame({ vhost }: { vhost: string }) {
  const { permissions, loading, error, retry } =
    useVhostTopicPermissions(vhost)
  const { data, actions } = useCluster()
  const [editing, setEditing] = useState<VhostTopicPermission | null>(null)
  const [removing, setRemoving] = useState<VhostTopicPermission | null>(null)
  const [granting, setGranting] = useState(false)

  if (loading) {
    return (
      <SectionFrame title="Topic permissions">
        <RegionSkeleton rows={2} />
      </SectionFrame>
    )
  }

  if (error) {
    return (
      <SectionFrame title="Topic permissions">
        <RegionError message={error} onRetry={retry} />
      </SectionFrame>
    )
  }

  const entries = permissions ?? []
  const grantable = entries.map((permission) => permission.user)
  const candidates = data.users.filter(
    (user) => !grantable.includes(user.username)
  )

  return (
    <>
      <SectionFrame
        title="Topic permissions"
        description={
          entries.length === 0
            ? "No exchange-scoped permissions on this virtual host."
            : `${entries.length} user topic ${
                entries.length === 1 ? "permission grants" : "permissions grant"
              } publish and read access.`
        }
        bodyClassName={entries.length ? "p-0" : undefined}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Grant topic permission"
            disabled={!candidates.length}
            onClick={() => setGranting(true)}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        }
      >
        <ConditionalRender
          condition={entries.length > 0}
          default={
            <RegionEmpty
              title="No topic permissions"
              description="No user is restricted to exchange patterns on this virtual host. Their permissions apply on every exchange."
              icon={<GlobeIcon />}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!candidates.length}
                  onClick={() => setGranting(true)}
                >
                  <PlusIcon data-icon="inline-start" aria-hidden="true" />
                  Grant topic permission
                </Button>
              }
            />
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Write</TableHead>
                <TableHead>Read</TableHead>
                <TableHead className="w-px text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((permission) => (
                <TableRow key={`${permission.user}|${permission.exchange}`}>
                  <TableCell className="data-cell font-medium">
                    {permission.user}
                  </TableCell>
                  <TableCell className="data-cell text-xs text-muted-foreground">
                    {permission.exchange || "All exchanges"}
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
                        aria-label={`Edit topic permission for ${permission.user}`}
                        onClick={() => setEditing(permission)}
                      >
                        <PencilIcon aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        aria-label={`Remove topic permission for ${permission.user}`}
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
      </SectionFrame>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Remove topic permission?"
        description={`${removing?.user ?? "This user"} loses write and read access via ${
          removing?.exchange || "all topic exchanges"
        } on ${vhost}. Other permissions are not affected.`}
        confirmLabel="Remove topic permission"
        tone="destructive"
        onConfirm={async () => {
          const target = removing
          setRemoving(null)
          if (!target) return
          try {
            await actions.deleteUserTopicPermission(
              vhost,
              target.user,
              target.exchange
            )
            retry()
            toast.success("Topic permission removed", {
              description: `${target.user} no longer has topic access on ${vhost}.`,
            })
          } catch (cause) {
            toast.error("Topic permission was not removed", {
              description:
                cause instanceof Error
                  ? cause.message
                  : "The management API did not respond.",
            })
          }
        }}
      />

      <EditVhostTopicPermissionDialog
        key={`${editing?.user ?? ""}|${editing?.exchange ?? ""}`}
        open={editing !== null}
        vhost={vhost}
        permission={editing}
        onSaved={retry}
        onClose={() => setEditing(null)}
      />

      <GrantVhostTopicPermissionDialog
        open={granting}
        vhost={vhost}
        grantedUsers={grantable}
        onSaved={retry}
        onClose={() => setGranting(false)}
      />
    </>
  )
}
