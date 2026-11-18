import { useState } from "react"
import { UserXIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { RegionEmpty, RegionError } from "@/components/region-states"
import {
  EditUserPermissionDialog,
  UserBackButton,
  UserDetailHeader,
  UserDetailSkeleton,
  UserLimitsPanel,
  UserPermissionsFrame,
  UserProfilePanel,
  UserTopicPermissionsFrame,
} from "@/components/features/users/details"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import type { UserPermission } from "@/lib/rabbit-api"
import { useUserDetail } from "@/hooks/use-user-detail"

export function UserDetailView() {
  const { route, navigate } = useRoute()
  const { actions } = useCluster()
  const { detail, loading, error, status, retry } = useUserDetail(route.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingPermission, setEditingPermission] =
    useState<UserPermission | null>(null)
  const username = route.id ?? "unknown"

  if (error) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={status === 404 ? "User not found" : username}
          description={
            status === 404
              ? "The broker does not know this user anymore."
              : "Could not load this user."
          }
          actions={<UserBackButton />}
        />
        <SectionFrame title="User">
          {status === 404 ? (
            <RegionEmpty
              title="User not found"
              description={`No internal user named ${username} exists on this cluster. Users authenticated elsewhere, such as over LDAP, do not appear here.`}
              icon={<UserXIcon />}
              action={
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href={routeHref("users")} />}
                >
                  Back to users
                </Button>
              }
            />
          ) : (
            <RegionError message={error} onRetry={retry} />
          )}
        </SectionFrame>
      </div>
    )
  }

  if (loading || !detail) {
    return <UserDetailSkeleton title={username} />
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <UserDetailHeader
        detail={detail}
        onDelete={() => setConfirmDelete(true)}
      />

      <DetailLayout
        main={
          <>
            <UserPermissionsFrame
              permissions={detail.permissions}
              onEdit={setEditingPermission}
            />
            <UserTopicPermissionsFrame
              permissions={detail.topicPermissions}
            />
          </>
        }
        side={
          <>
            <UserProfilePanel detail={detail} />
            <UserLimitsPanel limits={detail.limits} />
          </>
        }
      />

      <EditUserPermissionDialog
        key={editingPermission?.vhost ?? "edit-permission"}
        open={editingPermission !== null}
        username={detail.name}
        permission={editingPermission}
        onClose={() => setEditingPermission(null)}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete user?"
        description={`${detail.name} immediately loses access to ${detail.permissions.map((permission) => permission.vhost).join(", ") || "the cluster"}. Open connections are not closed.`}
        confirmLabel="Delete user"
        tone="destructive"
        onConfirm={async () => {
          setConfirmDelete(false)
          try {
            await actions.deleteUser(detail.name)
            toast.success("User deleted", {
              description: `${detail.name} was removed.`,
            })
            navigate(routeHref("users"))
          } catch (cause) {
            toast.error("User was not deleted", {
              description:
                cause instanceof Error
                  ? cause.message
                  : "The management API did not respond.",
            })
          }
        }}
      />
    </div>
  )
}
