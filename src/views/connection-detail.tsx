import { useMemo, useState } from "react";
import { ArrowRightIcon, UnplugIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail";
import { StateBadge, TlsBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtDate, fmtInt, fmtRate, fmtSince } from "@/lib/format";
import { NotFoundView } from "@/views/not-found";

export function ConnectionDetailView() {
  const { route, navigate } = useRoute();
  const { data, actions } = useCluster();
  const [confirmClose, setConfirmClose] = useState(false);

  const connection = data.connections.find((entry) => entry.id === route.id);
  const channels = useMemo(
    () => data.channels.filter((channel) => channel.connection === route.id),
    [data.channels, route.id]
  );
  const consumers = useMemo(
    () => data.consumers.filter((consumer) => consumer.connection === route.id),
    [data.consumers, route.id]
  );

  if (!connection) {
    return (
      <NotFoundView
        title="Connection not found"
        description={`No open connection with id ${route.id ?? "unknown"}. It may have been closed.`}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={connection.name}
        eyebrow={
          <>
            <Badge variant="success-light">Open</Badge>
            <Badge variant="outline">{connection.protocol}</Badge>
            <TlsBadge ssl={connection.ssl} />
            <VhostBadge>{connection.vhost}</VhostBadge>
          </>
        }
        description={`Client ${connection.client} connected from ${connection.from}`}
        actions={
          <Button type="button" variant="destructive" onClick={() => setConfirmClose(true)}>
            <UnplugIcon data-icon="inline-start" aria-hidden="true" />
            Close connection
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard label="Channels" value={fmtInt(channels.length)} detail={`${connection.user}`} />
        <KpiCard label="Receiving" value={fmtRate(connection.recvRate)} detail="Client to broker" />
        <KpiCard label="Sending" value={fmtRate(connection.sendRate)} detail="Broker to client" tone="success" />
        <KpiCard
          label="Consumers"
          value={fmtInt(consumers.length)}
          detail={`${fmtInt(channels.reduce((sum, channel) => sum + channel.unacked, 0))} unacked`}
        />
      </KpiGrid>

      <DetailLayout
        main={
          <>
            <SectionFrame
              title="Channels"
              description={`${channels.length} channels multiplexed on this connection.`}
            >
              {channels.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {channels.map((channel) => (
                    <li key={channel.id}>
                      <a
                        href={routeHref("channel", channel.id)}
                        className="flex min-w-0 flex-col gap-1 py-2 transition-colors first:pt-0 last:pb-0 hover:text-primary"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="data-cell shrink-0 font-medium">{channel.id}</span>
                            <span className="text-xs text-muted-foreground">
                              number {channel.number}
                            </span>
                          </span>
                          <StateBadge state={channel.state} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{channel.prefetch === 0 ? "no prefetch" : `prefetch ${channel.prefetch}`}</span>
                          <span aria-hidden="true" className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                          <span>{channel.consumers} consumers</span>
                          <span aria-hidden="true" className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                          <span className="data-cell">{fmtRate(channel.publishRate)} pub</span>
                          <span aria-hidden="true" className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                          <span className="data-cell">{fmtRate(channel.deliverRate)} del</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No channels are open.</p>
              )}
            </SectionFrame>

            <SectionFrame
              title="Consumers"
              description={`${consumers.length} subscriptions carried by this connection.`}
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
                        <span className="text-xs text-muted-foreground">{consumer.tag}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {consumer.channel} · prefetch {consumer.prefetch === 0 ? "unlimited" : consumer.prefetch} ·{" "}
                        {consumer.ackRequired ? "manual ack" : "auto ack"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">This connection carries no consumers.</p>
              )}
            </SectionFrame>
          </>
        }
        side={
          <>
            <FactPanel
              title="Details"
              facts={[
                { label: "Connection id", value: connection.id, mono: true },
                { label: "User", value: connection.user, mono: true },
                { label: "Virtual host", value: connection.vhost, mono: true },
                { label: "Node", value: connection.node.replace("rabbit@", ""), mono: true },
                { label: "Client", value: connection.client, mono: true },
                { label: "Heartbeat", value: connection.heartbeat ? `${connection.heartbeat}s` : "disabled" },
              ]}
            />
            <FactPanel
              title="Network"
              facts={[
                { label: "From", value: connection.from, mono: true },
                { label: "Listener", value: connection.peer, mono: true },
                { label: "TLS", value: connection.ssl ? "Enabled" : "Plain text" },
                { label: "Connected", value: fmtDate(connection.connectedAt) },
                { label: "Age", value: fmtSince(connection.connectedAt, new Date().getTime()) },
              ]}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close connection?"
        description={`${connection.name} and its ${channels.length} channels will be closed. Attached consumers stop receiving messages.`}
        confirmLabel="Close connection"
        tone="destructive"
        onConfirm={() => {
          actions.closeConnection(connection.id);
          toast.success("Connection closed", { description: `${connection.name} was closed.` });
          navigate(routeHref("connections"));
        }}
      />
    </div>
  );
}
