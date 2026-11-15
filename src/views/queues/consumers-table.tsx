import { RefreshCwIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { SectionFrame } from "@/components/detail";
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDuration, fmtInt } from "@/lib/format";
import type { QueueConsumer } from "@/lib/rabbit-api";
import { routeHref } from "@/lib/router";

type Props = {
  consumers: QueueConsumer[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function argumentText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function ArgumentsCell({ consumer }: { consumer: QueueConsumer }) {
  const entries = Object.entries(consumer.arguments);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="data-cell"
            aria-label={`Show arguments for ${consumer.tag}`}
          >
            {entries.length}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Arguments</PopoverTitle>
          <span className="data-cell text-xs text-muted-foreground">
            {consumer.tag}
          </span>
        </PopoverHeader>
        {entries.length ? (
          <dl className="flex max-h-64 flex-col divide-y divide-border overflow-auto">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
              >
                <dt className="data-cell text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  {key}
                </dt>
                <dd className="data-cell max-w-[60%] text-right text-xs [overflow-wrap:anywhere]">
                  {argumentText(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            This consumer has no arguments.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function QueueConsumersTable({
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
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <RegionSkeleton rows={3} />
      ) : consumers.length === 0 ? (
        <RegionEmpty
          title="No consumers"
          description="Messages accumulate until a consumer subscribes."
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
                    <Badge variant={consumer.active ? "success-light" : "outline"}>
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
                  <ArgumentsCell consumer={consumer} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionFrame>
  );
}
