import { ArrowRightIcon, RefreshCwIcon, UsersIcon } from "lucide-react";
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
import type { ChannelConsumer } from "@/lib/rabbit-api";
import { routeHref } from "@/lib/router";
import ConsumerActiveColumnHeader from "./consumer-active-column-header";
import { VhostBadge } from "@/components/badges";

type Props = {
  consumers: ChannelConsumer[];
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

function ArgumentsCell({ consumer }: { consumer: ChannelConsumer }) {
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
              <TableHead><ConsumerActiveColumnHeader /></TableHead>
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
                  <Badge variant={consumer.active ? "success-light" : "outline"}>
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
