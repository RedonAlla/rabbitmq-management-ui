import { useMemo, useState } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail";
import { StateBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt, fmtRate, fmtSince } from "@/lib/format";
import { NotFoundView } from "@/views/not-found";

export function ChannelDetailView() {
  const { route, navigate } = useRoute();
  const { data, actions } = useCluster();
  const [confirmClose, setConfirmClose] = useState(false);

  const channel = data.channels.find((entry) => entry.id === route.id);
  const connection = data.connections.find((entry) => entry.id === channel?.connection);
  const consumers = useMemo(
    () => data.consumers.filter((consumer) => consumer.channel === route.id),
    [data.consumers, route.id]
  );

  if (!channel) {
    return (
      <NotFoundView
        title="Channel not found"
        description={`No open channel with id ${route.id ?? "unknown"}. It may have been closed.`}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={`Channel ${channel.id}`}
        eyebrow={
          <>
            <StateBadge state={channel.state} />
            <VhostBadge>{channel.vhost}</VhostBadge>
            {channel.confirmMode ? <Badge variant="info-light">Confirm mode</Badge> : null}
            {channel.transactional ? <Badge variant="warning-light">Transactional</Badge> : null}
          </>
        }
        description={
          connection
            ? `Multiplexed on ${connection.name} · ${connection.protocol}`
            : "Connection details unavailable"
        }
        actions={
          <Button type="button" variant="destructive" onClick={() => setConfirmClose(true)}>
            <XIcon data-icon="inline-start" aria-hidden="true" />
            Close channel
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard label="Consumers" value={fmtInt(channel.consumers)} detail={`${consumers.length} subscriptions`} />
        <KpiCard label="Unacked" value={fmtInt(channel.unacked)} detail="Awaiting acknowledgement" tone="warning" />
        <KpiCard label="Publish" value={fmtRate(channel.publishRate)} detail="Messages in per second" />
        <KpiCard label="Deliver" value={fmtRate(channel.deliverRate)} detail="Messages out per second" tone="success" />
      </KpiGrid>

      <DetailLayout
        main={
          <SectionFrame
            title="Consumers"
            description={`${consumers.length} subscriptions on this channel.`}
          >
            {consumers.length ? (
              <ul className="flex flex-col divide-y divide-border">
                {consumers.map((consumer) => (
                  <li key={consumer.tag} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <a
                        href={routeHref("queue", consumer.queue)}
                        className="flex min-w-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
                      >
                        {consumer.queue}
                        <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      </a>
                      <span className="data-cell text-xs text-muted-foreground">{consumer.tag}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      prefetch {consumer.prefetch === 0 ? "unlimited" : consumer.prefetch} ·{" "}
                      {consumer.ackRequired ? "manual ack" : "auto ack"} ·{" "}
                      {consumer.exclusive ? "exclusive" : "shared"} · active{" "}
                      {fmtSince(consumer.since, new Date().getTime())}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">This channel carries no consumers.</p>
            )}
          </SectionFrame>
        }
        side={
          <>
            <FactPanel
              title="Details"
              facts={[
                { label: "Channel id", value: channel.id, mono: true },
                { label: "Number", value: String(channel.number), mono: true },
                { label: "Connection", value: channel.connection, mono: true },
                { label: "User", value: channel.user, mono: true },
                { label: "Virtual host", value: channel.vhost, mono: true },
                { label: "Node", value: channel.node, mono: true },
              ]}
            />
            <FactPanel
              title="In-flight counters"
              description="Work held by this channel that has not yet been settled."
              facts={[
                { label: "Acks uncommitted", value: fmtInt(channel.acksUncommitted) },
                { label: "Messages uncommitted", value: fmtInt(channel.messagesUncommitted) },
                { label: "Messages unconfirmed", value: fmtInt(channel.messagesUnconfirmed) },
                { label: "Messages unacknowledged", value: fmtInt(channel.unacked) },
                { label: "Pending raft commands", value: fmtInt(channel.pendingRaftCommands) },
                { label: "Cached segments", value: fmtInt(channel.cachedSegments) },
              ]}
            />
            <FactPanel
              title="Flow control"
              facts={[
                { label: "Prefetch", value: channel.prefetch === 0 ? "Unlimited" : String(channel.prefetch) },
                { label: "Confirm mode", value: channel.confirmMode ? "Enabled" : "Disabled" },
                { label: "Transactional", value: channel.transactional ? "Yes" : "No" },
                { label: "Consumers", value: String(channel.consumers) },
              ]}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close channel?"
        description={`Channel ${channel.id} will be closed. Its consumers stop receiving messages and unacked deliveries are requeued.`}
        confirmLabel="Close channel"
        tone="destructive"
        onConfirm={() => {
          actions.closeChannel(channel.id);
          toast.success("Channel closed", { description: `Channel ${channel.id} was closed.` });
          navigate(routeHref("channels"));
        }}
      />
    </div>
  );
}
