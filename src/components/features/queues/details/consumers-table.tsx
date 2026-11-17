import { RefreshCwIcon, UsersIcon } from "lucide-react"
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
import type { QueueConsumer } from "@/lib/rabbit-api"
import { routeHref } from "@/lib/router"
import { ConditionalRender } from "@/components/conditional-render"

type Props = {
  consumers: QueueConsumer[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function QueueConsumersTable({
  consumers,
  loading,
  error,
  onRetry,
}: Props) {
  return (
    <SectionFrame
      title="Consumers"
      description={`${consumers.length} ${consumers.length === 1 ? "consumer is" : "consumers are"} subscribed to this queue.`}
      bodyClassName={consumers.length === 0 ? undefined : "p-0"}
    >
      <ConditionalRender condition={error !== null}>
        <RegionError message={error!} onRetry={onRetry} />
      </ConditionalRender>

      <ConditionalRender condition={loading}>
        <RegionSkeleton rows={3} />
      </ConditionalRender>

      <ConditionalRender
        condition={consumers.length > 0}
        default={
          <RegionEmpty
            title="No consumers"
            description="Messages accumulate until a consumer subscribes."
            icon={<UsersIcon />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead>Ack required</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="text-right">Prefetch</TableHead>
              <TableHead className="text-right">Timeout</TableHead>
              <TableHead className="text-right">Arguments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumers.map((consumer) => (
              <TableRow key={consumer.tag}>
                <TableCell>
                  <a
                    href={routeHref("channel", consumer.channel)}
                    className="data-cell text-xs transition-colors hover:text-primary"
                  >
                    {consumer.channel}
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 flex-col gap-1">
                    <a
                      href={routeHref("connection", consumer.connection)}
                      className="data-cell text-xs transition-colors hover:text-primary"
                    >
                      {consumer.connection}
                    </a>
                    <span className="data-cell text-xs text-muted-foreground">
                      {consumer.tag}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{consumer.ackRequired ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <Badge
                      variant={consumer.active ? "success-light" : "outline"}
                    >
                      {consumer.active ? "Active" : "Inactive"}
                    </Badge>
                    {consumer.exclusive ? (
                      <Badge variant="info-light">Exclusive</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="data-cell text-right">
                  {consumer.prefetchCount === 0
                    ? "Unlimited"
                    : fmtInt(consumer.prefetchCount)}
                </TableCell>
                <TableCell className="data-cell text-right">
                  {consumer.consumerTimeout
                    ? fmtDuration(consumer.consumerTimeout)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <ConsumerArguments
                    tag={consumer.tag}
                    arguments={consumer.arguments}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConditionalRender>
    </SectionFrame>
  )
}
