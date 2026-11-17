import {
  ArrowLeftIcon,
  EraserIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
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
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { routeHref } from "@/lib/router"
import type { Queue } from "@/data/types"
import type { QueueDetail } from "@/lib/rabbit-api"

export function QueueBackButton() {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("queues")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to queues
    </Button>
  )
}

type Props = {
  queue: Queue
  detail: QueueDetail | null
  onPurge: () => void
  onDelete: () => void
  onAddBinding: () => void
}

export function QueueDetailHeader({
  queue,
  detail,
  onPurge,
  onDelete,
  onAddBinding,
}: Props) {
  const { openDialog } = useDialogs()
  const publish = () => openDialog({ type: "publish", vhost: queue.vhost })

  return (
    <PageHeader
      title={queue.name}
      eyebrow={
        <>
          <StateBadge state={detail?.state ?? queue.state} />
          <TypeBadge type={detail?.type ?? queue.type} />
          <VhostBadge>{queue.vhost}</VhostBadge>
          {detail?.internal ? <Badge variant="outline">Internal</Badge> : null}
          {detail?.exclusive ? (
            <Badge variant="outline">Exclusive</Badge>
          ) : null}
        </>
      }
      description={`${detail?.type ?? queue.type} queue on virtual host ${queue.vhost}${
        detail ? ` · node ${detail.node}` : ""
      }`}
      actions={
        <>
          <QueueBackButton />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Queue actions"
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
              Actions
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPurge}>
                <EraserIcon aria-hidden="true" />
                Purge messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={publish}>
                <SendIcon aria-hidden="true" />
                Publish message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddBinding}>
                <GitBranchIcon aria-hidden="true" />
                Add binding
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2Icon aria-hidden="true" />
                Delete queue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" onClick={publish}>
            <SendIcon data-icon="inline-start" aria-hidden="true" />
            Publish
          </Button>
        </>
      }
    />
  )
}
