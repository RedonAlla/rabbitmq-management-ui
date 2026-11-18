import {
  ArrowLeftIcon,
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
import { TypeBadge, VhostBadge } from "@/components/badges"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { routeHref } from "@/lib/router"
import type { Exchange } from "@/data/types"

export function ExchangeBackButton() {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("exchanges")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to exchanges
    </Button>
  )
}

interface Props {
  exchange: Exchange
  onDelete: () => void
}

export function ExchangeDetailHeader({ exchange, onDelete }: Props) {
  const { openDialog } = useDialogs()
  const publish = () =>
    openDialog({
      type: "publish",
      vhost: exchange.vhost,
      exchange: exchange.name,
    })

  return (
    <PageHeader
      title={exchange.name || "(default)"}
      eyebrow={
        <>
          <TypeBadge type={exchange.type} />
          <VhostBadge>{exchange.vhost}</VhostBadge>
          {exchange.name === "" ? (
            <Badge variant="outline">Default</Badge>
          ) : null}
          {exchange.internal ? <Badge variant="outline">Internal</Badge> : null}
        </>
      }
      description={`${exchange.type} exchange on virtual host ${exchange.vhost}`}
      actions={
        <>
          <ExchangeBackButton />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Exchange actions"
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
              Actions
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={publish}>
                <SendIcon aria-hidden="true" />
                Publish
              </DropdownMenuItem>
              {exchange.name ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2Icon aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
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
