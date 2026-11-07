import { useRoute, routeHref } from "@/lib/router";
import { SectionFrame } from "@/components/detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Queue } from "@/data/types";
import { StateBadge } from "@/components/badges";
import { fmtInt } from "@/lib/format";

type Props = {
  queues: Queue[]
}

export function QueuesNeedAttention({queues}: Props) {
  const { navigate } = useRoute();

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
      bodyClassName="p-0"
    >
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
            <TableRow key={q.name} onClick={() => navigate(routeHref("queue", q.name))}>
              <TableCell>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{q.name}</span>
                  <span className="text-xs text-muted-foreground">{q.vhost}</span>
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
    </SectionFrame>
  )
}
