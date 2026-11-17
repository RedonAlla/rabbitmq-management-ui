import { ArrowRightIcon, RefreshCwIcon, UsersIcon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { ConsumerArguments } from "@/components/consumer-arguments"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fmtDuration, fmtInt } from "@/lib/format"
import type { ChannelConsumer } from "@/lib/rabbit-api"
import { routeHref } from "@/lib/router"
import ConsumerActiveColumnHeader from "./consumer-active-column-header"
import { VhostBadge } from "@/components/badges"

type Props = {
  consumers: ChannelConsumer[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function ConsumersTable({
  consumers,
  loading,
  error,
  onRetry,
}: Props) {
  return (
    <SectionFrame
      title="Consumers"
      description={`${consumers.length} subscriptions on this channel.`}
      bodyClassName={consumers.length === 0 ? undefined : "p-0"}
    >
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <RegionSkeleton rows={3} />
      ) : consumers.length === 0 ? (
        <RegionEmpty
          title="No consumers on this channel"
          description="This channel carries no subscriptions."
          icon={<UsersIcon />}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              Retry
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Consumer tag</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Ack required</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Prefetch</TableHead>
              <TableHead>
                <ConsumerActiveColumnHeader />
              </TableHead>
              <TableHead>Consumer timeout</TableHead>
              <TableHead>Arguments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumers.map((consumer) => (
              <TableRow key={consumer.tag}>
                <TableCell>
                  <span className="data-cell text-xs">{consumer.tag}</span>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 flex-col">
                    <a
                      href={routeHref("queue", consumer.queue)}
                      className="flex min-w-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
                    >
                      <span className="truncate">{consumer.queue}</span>
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                    </a>
                    <span className="truncate text-xs text-muted-foreground">
                      <VhostBadge>{consumer.vhost}</VhostBadge>
                    </span>
                  </div>
                </TableCell>
                <TableCell>{consumer.ackRequired ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Badge
                    variant={consumer.active ? "success-light" : "outline"}
                  >
                    {consumer.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="data-cell">
                  {consumer.prefetchCount === 0
                    ? "Unlimited"
                    : fmtInt(consumer.prefetchCount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      consumer.activityStatus === "blocked"
                        ? "warning-light"
                        : "success-light"
                    }
                  >
                    {consumer.activityStatus}
                  </Badge>
                </TableCell>
                <TableCell className="data-cell">
                  {consumer.consumerTimeout
                    ? fmtDuration(consumer.consumerTimeout)
                    : "—"}
                </TableCell>
                <TableCell>
                  <ConsumerArguments
                    tag={consumer.tag}
                    arguments={consumer.arguments}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionFrame>
  )
}
