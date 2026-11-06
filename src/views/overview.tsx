import { useMemo, useState } from "react";
import {
  FileJsonIcon,
  InboxIcon,
  MessageSquareIcon,
  SendIcon,
  ServerIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { ChartPanel } from "@/components/chart-panel";
import { ResourceTable } from "@/components/resource-table";
import { RegionError } from "@/components/region-states";
import { SectionFrame } from "@/components/detail";
import { StateBadge } from "@/components/badges";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import {
  clusterHealthLabel,
  fmtCompact,
  fmtInt,
  fmtRate,
  fmtAgo,
  fmtDuration,
  pct,
} from "@/lib/format";
import type { Queue, RangeKey } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

const EVENT_TONE: Record<string, string> = {
  warn: "bg-warning",
  info: "bg-info",
  ok: "bg-success",
  error: "bg-destructive",
};

export function OverviewView() {
  const { data, totals, history, live, status, error, actions, lastUpdated } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [range, setRange] = useState<RangeKey>("1m");

  const attention = useMemo(
    () =>
      [...data.queues]
        .filter((queue) => queue.state !== "running" || queue.ready > 5000)
        .sort((a, b) => b.ready - a.ready)
        .slice(0, 6),
    [data.queues]
  );

  const points = history[range];
  const spark = (key: "ready" | "unacked" | "consumers" | "publish") =>
    points.map((point) => point[key]);
  const rateTrend = useMemo(() => {
    const first = points[0]?.publish ?? 0;
    const last = points[points.length - 1]?.publish ?? 0;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [points]);

  const columns = useMemo<ColumnDef<DataGridFeatures, Queue>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Queue" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.vhost}</span>
          </div>
        ),
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
      },
      {
        accessorKey: "ready",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ready" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.ready)}</span>,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.unacked)}</span>,
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{row.original.consumers}</span>,
      },
    ],
    []
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Overview"
        eyebrow={
          <>
            <Badge variant="success-light">{clusterHealthLabel(data.cluster, totals)}</Badge>
            <span className="text-xs text-muted-foreground">
              {data.cluster.node} · Erlang {data.cluster.erlang}
            </span>
          </>
        }
        description="Cluster health, message flow and queue pressure at a glance."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => openDialog({ type: "add-queue" })}
            >
              Add queue
            </Button>
            <Button type="button" onClick={() => openDialog({ type: "publish" })}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish message
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(routeHref("definitions"))}
            >
              <FileJsonIcon data-icon="inline-start" aria-hidden="true" />
              Definitions
            </Button>
          </>
        }
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <KpiGrid>
        <KpiCard
          label="Ready messages"
          value={fmtCompact(totals.ready)}
          detail={`${fmtInt(totals.ready)} across ${totals.queues} queues`}
          trend={data.cluster.trends.ready}
          icon={<InboxIcon aria-hidden="true" />}
          spark={spark("ready")}
        />
        <KpiCard
          label="Unacked"
          value={fmtCompact(totals.unacked)}
          detail="Awaiting consumer acknowledgement"
          trend={data.cluster.trends.unacked}
          icon={<TimerIcon aria-hidden="true" />}
          spark={spark("unacked")}
          tone="warning"
        />
        <KpiCard
          label="Consumers"
          value={fmtInt(totals.consumers)}
          detail={`${totals.channels} channels open`}
          trend={data.cluster.trends.consumers}
          icon={<UsersIcon aria-hidden="true" />}
          spark={spark("consumers")}
          tone="success"
        />
        <KpiCard
          label="Publish rate"
          value={fmtRate(totals.publishRate)}
          detail={`Delivering ${fmtRate(totals.deliverRate)}`}
          trend={rateTrend}
          icon={<MessageSquareIcon aria-hidden="true" />}
          spark={spark("publish")}
          tone="success"
        />
      </KpiGrid>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:items-start">
        <ChartPanel
          title="Message rates"
          description="Publish, deliver and acknowledgement throughput."
          data={points}
          series={[
            { key: "publish", label: "Publish", color: "var(--chart-1)" },
            { key: "deliver", label: "Deliver", color: "var(--chart-2)" },
            { key: "ack", label: "Ack", color: "var(--chart-3)" },
          ]}
          range={range}
          onRangeChange={setRange}
          loading={status === "loading"}
          error={error}
          onRetry={actions.retry}
        />

        <SectionFrame
          title="Cluster nodes"
          description={`${data.nodes.length} nodes · ${fmtDuration(data.nodes[0].uptime)} uptime`}
          actions={<Badge variant="outline">{data.cluster.version}</Badge>}
        >
          <div className="flex flex-col divide-y divide-border">
            {data.nodes.map((node) => (
              <div key={node.name} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2">
                  <IconTile variant="outline" size="xs" aria-hidden="true">
                    <ServerIcon />
                  </IconTile>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {node.name.replace("rabbit@", "")}
                  </span>
                  <Badge variant="outline">{node.type}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span className="text-mono">CPU {node.cpu.toFixed(0)}%</span>
                  <span className="text-mono">Mem {node.memory.toFixed(2)} GB</span>
                  <span className="text-mono">{node.sockets} sockets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={pct(node.memory, node.memoryMax)}
                    aria-label={`${node.name} memory pressure`}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">
                    {pct(node.memory, node.memoryMax).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionFrame>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-sm font-semibold">Queues needing attention</h2>
              <p className="text-xs text-muted-foreground">
                Idle, degraded or backlogged queues.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(routeHref("queues"))}>
              View all
            </Button>
          </div>
          <ResourceTable
            data={attention}
            columns={columns}
            noun="queues"
            pageSize={6}
            showPagination={false}
            minWidth="min-w-[560px]"
            loading={status === "loading"}
            error={error}
            onRetry={actions.retry}
            onRowClick={(queue) => navigate(routeHref("queue", queue.name))}
            empty="No queues need attention right now."
          />
        </div>

        <SectionFrame
          title="Recent activity"
          description="Simulated events from the broker."
          actions={
            live ? (
              <Badge variant="success-light">
                <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline">Paused</Badge>
            )
          }
        >
          <ol className="flex flex-col divide-y divide-border">
            {data.events.slice(0, 5).map((event) => (
              <li key={event.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${EVENT_TONE[event.type] ?? "bg-muted-foreground"}`}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{event.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtAgo(event.time, new Date().getTime())}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{event.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </SectionFrame>
      </div>

      <Frame spacing="sm" className="min-w-0">
        <FramePanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-success/40" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span>
              {data.nodes.length} nodes · {data.ports.length} listeners · updated{" "}
              {fmtAgo(lastUpdated, new Date().getTime())}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {data.ports.slice(0, 4).map((port) => (
              <Badge key={port.port} variant="outline">
                <span className="text-mono">{port.port}</span>
                {port.protocol}
              </Badge>
            ))}
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}
