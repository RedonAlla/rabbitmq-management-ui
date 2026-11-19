import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { routeHref } from "@/lib/router"
import type { Vhost } from "@/data/types"
import type { VhostDetail } from "@/lib/rabbit-api"

export function VhostBackButton() {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("vhosts")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to virtual hosts
    </Button>
  )
}

export function VhostDetailHeader({
  vhost,
  detail,
  onEdit,
  onDelete,
}: {
  vhost: Vhost
  detail: VhostDetail | null
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <PageHeader
      title={vhost.name}
      eyebrow={
        <>
          {vhost.name === "/" ? (
            <Badge variant="outline">Default</Badge>
          ) : null}
          {detail?.protectedFromDeletion ?? vhost.protectedFromDeletion ? (
            <Badge variant="warning-light">Protected</Badge>
          ) : null}
          {detail?.tracing ?? vhost.tracing ? (
            <Badge variant="info-light">Tracing on</Badge>
          ) : null}
        </>
      }
      description={
        (detail?.description ?? vhost.description) || "No description."
      }
      actions={
        <>
          <VhostBackButton />
          <Button
            type="button"
            variant="destructive"
            disabled={vhost.name === "/"}
            onClick={onDelete}
          >
            <Trash2Icon data-icon="inline-start" aria-hidden="true" />
            Delete virtual host
          </Button>
          <Button type="button" onClick={onEdit}>
            <PencilIcon data-icon="inline-start" aria-hidden="true" />
            Edit virtual host
          </Button>
        </>
      }
    />
  )
}