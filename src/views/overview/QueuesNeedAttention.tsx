import { InboxIcon } from "lucide-react"
import { useRoute, routeHref } from "@/lib/router"
import { SectionFrame } from "@/components/detail"
import { RegionEmpty, RegionSkeleton } from "@/components/region-states"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Queue } from "@/data/types"
import { StateBadge } from "@/components/badges"
import { fmtInt } from "@/lib/format"

type Props = {
  queues: Queue[]
  total: number
  loading: boolean
}

export default function QueuesNeedAttention({ queues, total, loading }: Props) {
  const { navigate } = useRoute()

  return (
    <SectionFrame
      title="Queues needing attention"
      description="Idle, degraded or backlogged queues."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(routeHref("queues"))}
        >
          View all
        </Button>
      }
      bodyClassName={queues.length === 0 ? undefined : "p-0"}
    >
      {loading && total === 0 ? (
        <RegionSkeleton rows={3} />
      ) : queues.length === 0 ? (
        <RegionEmpty
          title="No queues need attention"
          description={
            total === 0
              ? "No queues are declared on this cluster."
              : "Every queue is running with a healthy backlog."
          }
          icon={<InboxIcon />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Queue</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Ready</TableHead>
              <TableHead>Unacked</TableHead>
              <TableHead>Consumers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.map((q) => (
              <TableRow
                key={q.name}
                onClick={() => navigate(routeHref("queue", q.name))}
              >
                <TableCell>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{q.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {q.vhost}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StateBadge state={q.state} />
                </TableCell>
                <TableCell>
                  <span className="text-right text-sm">{fmtInt(q.ready)}</span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className="data-cell">{fmtInt(q.unacked)}</span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className="data-cell">{q.consumers}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionFrame>
  )
}
