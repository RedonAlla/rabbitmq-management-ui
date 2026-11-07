import { useMemo, useState } from "react";
import {
  FileJsonIcon,
  SendIcon,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ChartPanel } from "@/components/chart-panel";
import { RegionError } from "@/components/region-states";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { clusterHealthLabel } from "@/lib/format";
import type { RangeKey } from "@/data/types";
import QueuesNeedAttention from "./overview/QueuesNeedAttention";
import ListeningPorts from "./overview/ListeningPorts";
import WebContexts from "./overview/WebContexts";
import Kpis from "./overview/Kpis";
import Nodes from "./overview/Nodes";
import RecentActivity from "./overview/RecentActivity";

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

      <Kpis
        data={data}
        range={range}
        totals={totals}
        history={history}
      />

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

        <Nodes data={data} />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
        <QueuesNeedAttention queues={attention} />
        <RecentActivity events={data.events} live={live} />
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
  );
}