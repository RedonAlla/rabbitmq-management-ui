import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, UnplugIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import {
  DetailLayout,
  FactPanel,
  SectionFrame,
} from "@/components/detail";
import {
  ConnectionStateBadge,
  StateBadge,
  TlsBadge,
  VhostBadge,
} from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtDate, fmtInt, fmtRate, fmtSince } from "@/lib/format";
import { IS_DEMO } from "@/lib/env";
import {
  type ConnectionDetail,
  type ConnectionRateSample,
} from "@/lib/rabbit-api";
import { useConnectionDetail } from "@/hooks/use-connection-detail";
import { NotFoundView } from "@/views/not-found";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "number" ? fmtInt(value) : value;
}

function chronological(samples: ConnectionRateSample[]): number[] {
  return [...samples].reverse().map((sample) => sample.sample);
}

interface SampleRow {
  timestamp: number;
  recv?: number;
  send?: number;
  reductions?: number;
}

function mergeSamples(connection: ConnectionDetail): SampleRow[] {
  const rows = new Map<number, SampleRow>();
  const add = (
    key: "recv" | "send" | "reductions",
    samples: ConnectionRateSample[]
  ) => {
    for (const sample of samples) {
      const row = rows.get(sample.timestamp) ?? { timestamp: sample.timestamp };
      row[key] = sample.sample;
      rows.set(sample.timestamp, row);
    }
  };
  add("recv", connection.recv.samples);
  add("send", connection.send.samples);
  if (connection.reductionsRate) {
    add("reductions", connection.reductionsRate.samples);
  }
  return [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
}

interface PropertyEntry {
  label: string;
  value: unknown;
}

function flattenProperties(
  record: Record<string, unknown>,
  prefix = ""
): PropertyEntry[] {
  return Object.entries(record).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenProperties(value as Record<string, unknown>, label);
    }
    return [{ label, value }];
  });
}

function propertyText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return fmtInt(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function PropertyList({ entries }: { entries: PropertyEntry[] }) {
  if (!entries.length) {
    return (
      <p className="text-xs text-muted-foreground">
        The broker did not report any properties.
      </p>
    );
  }
  return (
    <dl className="flex flex-col divide-y divide-border">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
        >
          <dt className="data-cell text-xs text-muted-foreground">
            {entry.label}
          </dt>
          <dd className="data-cell max-w-[65%] text-right text-sm [overflow-wrap:anywhere]">
            {propertyText(entry.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TrafficRow({
  label,
  rate,
  avgRate,
  total,
  unit,
  count,
}: {
  label: string;
  rate: number;
  avgRate: number;
  total: number;
  unit: string;
  count?: number;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="data-cell">{fmtRate(rate)} now</span>
        <span className="data-cell">avg {fmtRate(avgRate)}</span>
        <span className="data-cell">
          {fmtInt(total)} {unit}
        </span>
        {typeof count === "number" ? (
          <span className="data-cell">{fmtInt(count)} packets</span>
        ) : null}
      </div>
    </li>
  );
}

export function ConnectionDetailView() {
  return IS_DEMO ? <DemoConnectionDetail /> : <ApiConnectionDetail />;
}

function DemoConnectionDetail() {
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
                { label: "Node", value: connection.node, mono: true },
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

function ApiConnectionDetail() {
  const { route, navigate } = useRoute();
  const { connection, loading, error, status, retry, closeConnection } =
    useConnectionDetail(route.id);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const backAction = (
    <Button variant="outline" render={<a href={routeHref("connections")} />}>
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to connections
    </Button>
  );

  if (error) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={status === 404 ? "Connection not found" : "Connection"}
          description={
            status === 404
              ? "The broker does not know this connection anymore."
              : "Could not load this connection."
          }
          actions={backAction}
        />
        <SectionFrame title="Connection">
          {status === 404 ? (
            <RegionEmpty
              title="Connection not found"
              description={`No open connection with name ${route.id ?? "unknown"}. It may have been closed.`}
              icon={<UnplugIcon />}
              action={
                <Button variant="outline" render={<a href={routeHref("connections")} />}>
                  <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                  Back to connections
                </Button>
              }
            />
          ) : (
            <RegionError message={error} onRetry={retry} />
          )}
        </SectionFrame>
      </div>
    );
  }

  if (loading || !connection) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={route.id ?? "Connection"}
          description="Loading connection details."
          actions={backAction}
        />
        <KpiGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <Frame key={index} spacing="sm" className="min-w-0">
              <FramePanel className="flex flex-col gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
              </FramePanel>
            </Frame>
          ))}
        </KpiGrid>
        <DetailLayout
          main={
            <>
              <SectionFrame title="Traffic">
                <RegionSkeleton rows={3} />
              </SectionFrame>
              <SectionFrame title="Rate samples">
                <RegionSkeleton rows={6} />
              </SectionFrame>
            </>
          }
          side={
            <>
              <SectionFrame title="Connection">
                <RegionSkeleton rows={5} />
              </SectionFrame>
              <SectionFrame title="Network">
                <RegionSkeleton rows={5} />
              </SectionFrame>
            </>
          }
        />
      </div>
    );
  }

  const sampleRows = mergeSamples(connection);
  const clientProperties = flattenProperties(connection.clientProperties);
  const garbageCollection = connection.garbageCollection
    ? flattenProperties(connection.garbageCollection)
    : null;
  const reductionsSamples = connection.reductionsRate
    ? chronological(connection.reductionsRate.samples)
    : [];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={connection.name}
        eyebrow={
          <>
            <ConnectionStateBadge state={connection.state} />
            <Badge variant="outline">{connection.protocol}</Badge>
            <TlsBadge ssl={connection.ssl} />
            <VhostBadge>{connection.vhost}</VhostBadge>
          </>
        }
        description={`Client ${connection.client} connected from ${connection.peerHost}:${connection.peerPort}`}
        actions={
          <>
            {backAction}
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmClose(true)}
            >
              <UnplugIcon data-icon="inline-start" aria-hidden="true" />
              Close connection
            </Button>
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Receiving"
          value={fmtRate(connection.recv.rate)}
          detail={`avg ${fmtRate(connection.recv.avgRate)}`}
          spark={chronological(connection.recv.samples)}
        />
        <KpiCard
          label="Sending"
          value={fmtRate(connection.send.rate)}
          detail={`avg ${fmtRate(connection.send.avgRate)}`}
          tone="success"
          spark={chronological(connection.send.samples)}
        />
        <KpiCard
          label="Reductions"
          value={
            connection.reductionsRate
              ? fmtRate(connection.reductionsRate.rate)
              : fmtInt(connection.reductions)
          }
          detail={fmtInt(connection.reductions) + " total"}
          spark={reductionsSamples}
        />
        <KpiCard
          label="Channels"
          value={fmtInt(connection.channels)}
          detail={`channel max ${orDash(connection.channelMax)}`}
        />
      </KpiGrid>

      <DetailLayout
        main={
          <>
            <SectionFrame
              title="Traffic"
              description="Throughput reported by the management API for this connection."
            >
              <ul className="flex flex-col divide-y divide-border">
                <TrafficRow
                  label="Received"
                  rate={connection.recv.rate}
                  avgRate={connection.recv.avgRate}
                  total={connection.recvOct}
                  unit="bytes"
                  count={connection.recvCount}
                />
                <TrafficRow
                  label="Sent"
                  rate={connection.send.rate}
                  avgRate={connection.send.avgRate}
                  total={connection.sendOct}
                  unit="bytes"
                  count={connection.sendCount}
                />
                <TrafficRow
                  label="Reductions"
                  rate={connection.reductionsRate?.rate ?? 0}
                  avgRate={connection.reductionsRate?.avgRate ?? 0}
                  total={connection.reductions}
                  unit="reductions"
                />
              </ul>
            </SectionFrame>

            <SectionFrame
              title="Rate samples"
              description={
                sampleRows.length
                  ? `Metric samples collected every 5 seconds over the last 60 seconds.`
                  : "The broker keeps rate history for active connections only."
              }
            >
              {sampleRows.length ? (
                <div className="flex flex-col">
                  <div className="grid grid-cols-[6rem_repeat(3,minmax(0,1fr))] items-center gap-2 border-b border-border py-2 text-xs font-medium text-muted-foreground">
                    <span>Time</span>
                    <span className="text-right">Received bytes</span>
                    <span className="text-right">Sent bytes</span>
                    <span className="text-right">Reductions</span>
                  </div>
                  <div>
                    {sampleRows.map((sample) => (
                      <div
                        key={sample.timestamp}
                        className="grid grid-cols-[6rem_repeat(3,minmax(0,1fr))] items-center gap-2 border-b border-border py-1.5 text-xs last:border-b-0"
                      >
                        <span className="data-cell text-muted-foreground">
                          {timeFmt.format(sample.timestamp)}
                        </span>
                        <span className="data-cell text-right">
                          {orDash(sample.recv)}
                        </span>
                        <span className="data-cell text-right">
                          {orDash(sample.send)}
                        </span>
                        <span className="data-cell text-right">
                          {orDash(sample.reductions)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No rate samples were reported for this connection.
                </p>
              )}
            </SectionFrame>

            <SectionFrame
              title="Client properties"
              description="Properties the client library sent in its connection handshake."
            >
              <PropertyList entries={clientProperties} />
            </SectionFrame>

            <SectionFrame
              title="Garbage collection"
              description="Erlang GC statistics reported for the connection process."
            >
              {garbageCollection ? (
                <PropertyList entries={garbageCollection} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  The broker did not report garbage collection statistics for this connection.
                </p>
              )}
            </SectionFrame>
          </>
        }
        side={
          <>
            <FactPanel
              title="Connection"
              facts={[
                { label: "Connection id", value: connection.name, mono: true },
                {
                  label: "Provided name",
                  value: orDash(connection.userProvidedName),
                  mono: true,
                },
                { label: "User", value: connection.user, mono: true },
                {
                  label: "Acting user",
                  value: orDash(connection.userWhoPerformedAction),
                  mono: true,
                },
                { label: "Virtual host", value: connection.vhost, mono: true },
                {
                  label: "Node",
                  value: connection.node,
                  mono: true,
                },
                { label: "Type", value: connection.type },
                {
                  label: "State",
                  value: <ConnectionStateBadge state={connection.state} />,
                },
                { label: "Protocol", value: connection.protocol },
                { label: "Auth", value: connection.authMechanism },
                { label: "Channels", value: fmtInt(connection.channels) },
                { label: "Channel max", value: orDash(connection.channelMax) },
                { label: "Frame max", value: `${fmtInt(connection.frameMax)} bytes` },
              ]}
            />
            <FactPanel
              title="Network"
              facts={[
                {
                  label: "Host",
                  value: `${connection.host}:${connection.port}`,
                  mono: true,
                },
                {
                  label: "Peer",
                  value: `${connection.peerHost}:${connection.peerPort}`,
                  mono: true,
                },
                { label: "TLS", value: connection.ssl ? "Enabled" : "Plain text" },
                { label: "SSL protocol", value: orDash(connection.sslProtocol) },
                { label: "Cipher", value: orDash(connection.sslCipher), mono: true },
                { label: "Key exchange", value: orDash(connection.sslKeyExchange) },
                { label: "SSL hash", value: orDash(connection.sslHash) },
                {
                  label: "Peer cert subject",
                  value: orDash(connection.peerCertSubject),
                  mono: true,
                },
                {
                  label: "Peer cert issuer",
                  value: orDash(connection.peerCertIssuer),
                  mono: true,
                },
                {
                  label: "Peer cert serial",
                  value: orDash(connection.peerCertSerialNumber),
                  mono: true,
                },
                {
                  label: "Peer cert validity",
                  value: orDash(connection.peerCertValidity),
                  mono: true,
                },
                {
                  label: "Heartbeat",
                  value: connection.timeout ? `${connection.timeout}s` : "disabled",
                },
                { label: "Send pending", value: `${fmtInt(connection.sendPending)} bytes` },
              ]}
            />
            <FactPanel
              title="Activity"
              facts={[
                { label: "Connected at", value: dateTimeFmt.format(connection.connectedAt) },
                {
                  label: "Age",
                  value: fmtSince(connection.connectedAt, new Date().getTime()),
                },
                { label: "Received", value: `${fmtInt(connection.recvOct)} bytes` },
                { label: "Sent", value: `${fmtInt(connection.sendOct)} bytes` },
                { label: "Packets received", value: fmtInt(connection.recvCount) },
                { label: "Packets sent", value: fmtInt(connection.sendCount) },
                { label: "Reductions", value: fmtInt(connection.reductions) },
              ]}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={(open) => {
          if (open) return;
          setConfirmClose(false);
          setCloseReason("");
        }}
        title="Close connection?"
        description={`${connection.name} and its ${connection.channels} channels will be closed. Attached consumers stop receiving messages.`}
        confirmLabel="Close connection"
        tone="destructive"
        onConfirm={() => {
          const reason = closeReason;
          setConfirmClose(false);
          setCloseReason("");
          closeConnection(reason)
            .then(() => {
              toast.success("Connection closed", {
                description: `${connection.name} was closed.`,
              });
              navigate(routeHref("connections"));
            })
            .catch((cause: unknown) => {
              toast.error("Connection was not closed", {
                description:
                  cause instanceof Error
                    ? cause.message
                    : "The management API did not respond.",
              });
            });
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="connection-close-reason">Reason</Label>
          <Textarea
            id="connection-close-reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            placeholder="Why is this connection being closed? (optional)"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
