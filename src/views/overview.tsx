import { useMemo, useState } from "react"
import { FileJsonIcon, SendIcon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { ChartPanel } from "@/components/chart-panel"
import { RegionError } from "@/components/region-states"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import { clusterHealthLabel, fmtCompact } from "@/lib/format"
import type { RangeKey } from "@/data/types"
import QueuesNeedAttention from "./overview/QueuesNeedAttention"
import ListeningPorts from "./overview/ListeningPorts"
import WebContexts from "./overview/WebContexts"
import Kpis from "./overview/Kpis"
import Nodes from "./overview/Nodes"
import RecentActivity from "./overview/RecentActivity"

function fmtOpsRate(value: number): string {
  return value > 0 && value < 1 ? value.toFixed(2) : fmtCompact(value)
}

export function OverviewView() {
  const { data, totals, history, live, status, error, actions, lastUpdated } =
    useCluster()
  const { openDialog } = useDialogs()
  const { navigate } = useRoute()
  const [range, setRange] = useState<RangeKey>("1m")

  const attention = useMemo(
    () =>
      [...data.queues]
        .filter((queue) => queue.state !== "running" || queue.ready > 5000)
        .sort((a, b) => b.ready - a.ready)
        .slice(0, 6),
    [data.queues]
  )

  const points = history[range]

  const chartEmptyAction = (
    <Button type="button" variant="outline" size="sm" onClick={actions.retry}>
      Refresh
    </Button>
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Overview"
        eyebrow={
          <>
            <Badge variant="success-light">
              {clusterHealthLabel(data.cluster, totals)}
            </Badge>
            {data.cluster.node ? (
              <span className="text-xs text-muted-foreground">
                {data.cluster.node} · Erlang {data.cluster.erlang}
              </span>
            ) : null}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => openDialog({ type: "publish" })}
            >
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish message
            </Button>
            <Button
              type="button"
              onClick={() => navigate(routeHref("definitions"))}
            >
              <FileJsonIcon data-icon="inline-start" aria-hidden="true" />
              Definitions
            </Button>
          </>
        }
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <Kpis data={data} range={range} totals={totals} history={history} />

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
          emptyAction={chartEmptyAction}
        />

        <Nodes
          data={data}
          loading={status === "loading"}
          onRetry={actions.retry}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
        <QueuesNeedAttention
          queues={attention}
          total={data.queues.length}
          loading={status === "loading"}
        />
        <RecentActivity events={data.events} live={live} />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <ChartPanel
          title="Queued messages"
          description="Ready and unacknowledged messages over time."
          data={points}
          series={[
            { key: "ready", label: "Ready", color: "var(--chart-1)" },
            { key: "unacked", label: "Unacked", color: "var(--chart-2)" },
          ]}
          range={range}
          onRangeChange={setRange}
          loading={status === "loading"}
          error={error}
          onRetry={actions.retry}
          emptyAction={chartEmptyAction}
          emptyDescription="Queue depth appears after the first polling window."
        />
        <ChartPanel
          title="Connection operations"
          description="Connections opened and closed per second."
          data={points}
          series={[
            {
              key: "connectionCreated",
              label: "Opened",
              color: "var(--chart-1)",
            },
            {
              key: "connectionClosed",
              label: "Closed",
              color: "var(--chart-2)",
            },
          ]}
          range={range}
          onRangeChange={setRange}
          loading={status === "loading"}
          error={error}
          onRetry={actions.retry}
          emptyAction={chartEmptyAction}
          emptyDescription="Connection churn appears after the first polling window."
          valueFormatter={fmtOpsRate}
        />
        <ChartPanel
          title="Channel operations"
          description="Channels opened and closed per second."
          data={points}
          series={[
            { key: "channelCreated", label: "Opened", color: "var(--chart-1)" },
            { key: "channelClosed", label: "Closed", color: "var(--chart-2)" },
          ]}
          range={range}
          onRangeChange={setRange}
          loading={status === "loading"}
          error={error}
          onRetry={actions.retry}
          emptyAction={chartEmptyAction}
          emptyDescription="Channel churn appears after the first polling window."
          valueFormatter={fmtOpsRate}
        />
        <ChartPanel
          title="Queue operations"
          description="Queues created, deleted and declared per second."
          data={points}
          series={[
            { key: "queueCreated", label: "Created", color: "var(--chart-1)" },
            { key: "queueDeleted", label: "Deleted", color: "var(--chart-2)" },
            {
              key: "queueDeclared",
              label: "Declared",
              color: "var(--chart-3)",
            },
          ]}
          range={range}
          onRangeChange={setRange}
          loading={status === "loading"}
          error={error}
          onRetry={actions.retry}
          emptyAction={chartEmptyAction}
          emptyDescription="Queue churn appears after the first polling window."
          valueFormatter={fmtOpsRate}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <ListeningPorts
          ports={data.ports}
          loading={status === "loading"}
          updated={lastUpdated}
          onRetry={actions.retry}
        />
        <WebContexts
          contexts={data.webContexts}
          loading={status === "loading"}
          onRetry={actions.retry}
        />
      </div>
    </div>
  )
}
