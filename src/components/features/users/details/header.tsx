import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { routeHref } from "@/lib/router"
import type { UserDetail } from "@/lib/rabbit-api"

export function UserBackButton() {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("users")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to users
    </Button>
  )
}

export function UserDetailHeader({
  detail,
  onDelete,
}: {
  detail: UserDetail
  onDelete: () => void
}) {
  const { openDialog } = useDialogs()

  const edit = () =>
    openDialog({
      type: "edit-user",
      user: {
        username: detail.name,
        tags: detail.tags,
        vhosts: detail.permissions.map((permission) => permission.vhost),
        hasPassword: detail.hasPassword,
      },
    })

  return (
    <PageHeader
      title={detail.name}
      eyebrow={
        <>
          {detail.tags.length ? (
            detail.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">No tags</Badge>
          )}
          <Badge variant={detail.hasPassword ? "success-light" : "outline"}>
            {detail.hasPassword ? "Password set" : "No password"}
          </Badge>
        </>
      }
      description={
        detail.permissions.length
          ? `Management user with access to ${detail.permissions.length} virtual ${
              detail.permissions.length === 1 ? "host" : "hosts"
            }.`
          : "Management user without access to any virtual host."
      }
      actions={
        <>
          <UserBackButton />
          <Button
            type="button"
            variant="destructive"
            disabled={detail.name === "admin"}
            onClick={onDelete}
          >
            <Trash2Icon data-icon="inline-start" aria-hidden="true" />
            Delete user
          </Button>
          <Button type="button" onClick={edit}>
            <PencilIcon data-icon="inline-start" aria-hidden="true" />
            Edit user
          </Button>
        </>
      }
    />
  )
}
