import { useState } from "react";
import {
  ArrowLeftIcon,
  HeartIcon,
  UnplugIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PageHeader } from "@/components/page-header";
import { KpiCard, KpiGrid } from "@/components/kpi";
import {
  DetailLayout,
  FactPanel,
  SectionFrame,
} from "@/components/detail";
import {
  ConnectionStateBadge,
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
import { useRoute, routeHref } from "@/lib/router";
import { fmtCompact, fmtInt, fmtRate, fmtSince } from "@/lib/format";
import {
  type ConnectionDetail,
  type ConnectionRateRange,
  type ConnectionRateSample,
} from "@/lib/rabbit-api";
import { useConnectionDetail } from "@/hooks/use-connection-detail";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RATE_RANGES: {
  value: ConnectionRateRange;
  label: string;
  ariaLabel: string;
}[] = [
  { value: 60, label: "1m", ariaLabel: "Last minute" },
  { value: 600, label: "10m", ariaLabel: "Last ten minutes" },
  { value: 3600, label: "1h", ariaLabel: "Last hour" },
];

const RATE_WINDOW: Record<ConnectionRateRange, string> = {
  60: "last minute",
  600: "last ten minutes",
  3600: "last hour",
};

const GC_PROPERTY_LABELS: Record<string, string> = {
  min_bin_vheap_size: "Minimum binary virtual heap size in words (min_bin_vheap_size)",
  min_heap_size: "Minimum heap size in words (min_heap_size)",
  fullsweep_after: "Maximum generational collections before fullsweep (fullsweep_after)",
  minor_gcs: "Number of minor GCs (minor_gcs)",
  max_heap_size: "Maximum amount of heap memory (max_heap_size)",
};

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

interface RateChartPoint {
  label: string;
  recv?: number;
  send?: number;
  reductions?: number;
}

function samplesToRates(
  samples: ConnectionRateSample[]
): Map<number, number> {
  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  const rates = new Map<number, number>();
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const seconds = (current.timestamp - previous.timestamp) / 1000;
    if (seconds <= 0) continue;
    rates.set(
      current.timestamp,
      Math.max(0, (current.sample - previous.sample) / seconds)
    );
  }
  return rates;
}

function buildRateChartData(connection: ConnectionDetail): RateChartPoint[] {
  const recvRates = samplesToRates(connection.recv.samples);
  const sendRates = samplesToRates(connection.send.samples);
  const reductionsRates = connection.reductionsRate
    ? samplesToRates(connection.reductionsRate.samples)
    : new Map<number, number>();
  const timestamps = new Set<number>([
    ...recvRates.keys(),
    ...sendRates.keys(),
    ...reductionsRates.keys(),
  ]);

  return [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) => ({
      label: timeFmt.format(timestamp),
      recv: recvRates.get(timestamp),
      send: sendRates.get(timestamp),
      reductions: reductionsRates.get(timestamp),
    }));
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

function fmtByteRate(value: number): string {
  return `${fmtRate(value).replace("/s", "")} B/s`;
}

function HeartbeatValue({ seconds }: { seconds: number }) {
  const enabled = seconds > 0;
  return (
    <span className="inline-flex items-center gap-1">
      <HeartIcon
        aria-hidden="true"
        fill="currentColor"
        className={`size-3.5 ${
          enabled ? "text-success-foreground" : "text-destructive-foreground"
        }`}
      />
      {enabled ? `${seconds}s` : "disabled"}
    </span>
  );
}

type RateSeriesKey = "recv" | "send" | "reductions";

function RateChart({
  title,
  data,
  series,
}: {
  title: string;
  data: RateChartPoint[];
  series: { key: RateSeriesKey; label: string; color: string; legend?: string }[];
}) {
  const config: ChartConfig = {};
  for (const item of series) {
    config[item.key] = { label: item.label, color: item.color };
  }
  const legendItems = series.filter((item) => item.legend);

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[200px] w-full"
      role="img"
      aria-label={`${title} chart`}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={30}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tickFormatter={(value: number) => fmtCompact(value)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value) => fmtCompact(Number(value))}
            />
          }
        />
        {series.map((item) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={`var(--color-${item.key})`}
            fill={`var(--color-${item.key})`}
            fillOpacity={0.14}
            strokeWidth={1.6}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
        {legendItems.length ? (
          <ChartLegend
            content={
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
                {legendItems.map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.legend}
                  </span>
                ))}
              </div>
            }
          />
        ) : series.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}

export function ConnectionDetailView() {
  const { route, navigate } = useRoute();
  const [range, setRange] = useState<ConnectionRateRange>(60);
  const { connection, loading, error, status, retry, closeConnection } =
    useConnectionDetail(route.id, range);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const rangeControl = (
    <Tabs
      value={String(range)}
      onValueChange={(value) =>
        setRange(Number(value) as ConnectionRateRange)
      }
    >
      <TabsList aria-label="Rate sample range">
        {RATE_RANGES.map((item) => (
          <TabsTrigger
            key={item.value}
            value={String(item.value)}
            aria-label={item.ariaLabel}
            className="px-2 text-xs"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  const backAction = (
    <Button variant="outline" nativeButton={false} render={<a href={routeHref("connections")} />}>
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
                <Button variant="outline" nativeButton={false} render={<a href={routeHref("connections")} />}>
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

  const chartData = buildRateChartData(connection);
  const clientProperties = flattenProperties(connection.clientProperties);
  const garbageCollection = connection.garbageCollection
    ? flattenProperties(connection.garbageCollection).map((entry) => ({
        ...entry,
        label: GC_PROPERTY_LABELS[entry.label] ?? entry.label,
      }))
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

            {chartData.length ? (
              <>
                <SectionFrame
                  title="Data rates"
                  description={`Octets received and sent per second over the ${RATE_WINDOW[range]}.`}
                  actions={rangeControl}
                >
                  <RateChart
                    title="Throughput"
                    data={chartData}
                    series={[
                      {
                        key: "recv",
                        label: "Received",
                        color: "var(--chart-1)",
                        legend: `From client: ${fmtByteRate(connection.recv.avgRate)}`,
                      },
                      {
                        key: "send",
                        label: "Sent",
                        color: "var(--chart-2)",
                        legend: `To client: ${fmtByteRate(connection.send.avgRate)}`,
                      },
                    ]}
                  />
                </SectionFrame>
                {connection.reductionsRate ? (
                  <SectionFrame
                    title="Reductions"
                    description={`Reductions per second over the ${RATE_WINDOW[range]}.`}
                    actions={rangeControl}
                  >
                    <RateChart
                      title="Reductions"
                      data={chartData}
                      series={[
                        {
                          key: "reductions",
                          label: "Reductions",
                          color: "var(--chart-3)",
                          legend: `Reductions: ${fmtRate(connection.reductionsRate.avgRate)}`,
                        },
                      ]}
                    />
                  </SectionFrame>
                ) : null}
              </>
            ) : (
              <SectionFrame
                title="Rate samples"
                description="The broker keeps rate history for active connections only."
              >
                <p className="text-xs text-muted-foreground">
                  No rate samples were reported for this connection.
                </p>
              </SectionFrame>
            )}

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
                  value: <HeartbeatValue seconds={connection.timeout} />,
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
