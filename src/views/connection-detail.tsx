import { useState } from "react"
import {
  ActivityIcon,
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  ArrowUpToLineIcon,
  GitBranchIcon,
  HeartIcon,
  UnplugIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { KpiCard, KpiGrid } from "@/components/kpi"
import { DetailLayout, FactPanel, SectionFrame } from "@/components/detail"
import { ConnectionStateBadge, TlsBadge, VhostBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRoute, routeHref } from "@/lib/router"
import { fmtInt, fmtRate, fmtSince, fmtTimestamp, orDash } from "@/lib/format"
import type { ConnectionRateRange } from "@/lib/rabbit-api"
import {
  buildRateChartData,
  chronological,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import { flattenProperties } from "@/lib/properties"
import { useConnectionDetail } from "@/hooks/use-connection-detail"
import { useConnectionChannels } from "@/hooks/use-connection-channels"
import ChannelsTable from "@/views/connections/channels-table"
import { ChartRangeTabs, RateChart } from "@/components/charts"
import { KpiSkeleton } from "@/components/kpi-skeleton"
import { PropertyList } from "@/components/property-list"

const GC_PROPERTY_LABELS: Record<string, string> = {
  min_bin_vheap_size:
    "Minimum binary virtual heap size in words (min_bin_vheap_size)",
  min_heap_size: "Minimum heap size in words (min_heap_size)",
  fullsweep_after:
    "Maximum generational collections before fullsweep (fullsweep_after)",
  minor_gcs: "Number of minor GCs (minor_gcs)",
  max_heap_size: "Maximum amount of heap memory (max_heap_size)",
}

function fmtByteRate(value: number): string {
  return `${fmtRate(value).replace("/s", "")} B/s`
}

function HeartbeatValue({ seconds }: { seconds: number }) {
  const enabled = seconds > 0
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
  )
}

export function ConnectionDetailView() {
  const { route, navigate } = useRoute()
  const [range, setRange] = useState<ConnectionRateRange>(60)
  const { connection, loading, error, status, retry, closeConnection } =
    useConnectionDetail(route.id, range)
  const {
    channels,
    loading: channelsLoading,
    error: channelsError,
    retry: retryChannels,
  } = useConnectionChannels(route.id)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closeReason, setCloseReason] = useState("")

  const rangeControl = (
    <ChartRangeTabs
      value={range}
      onChange={setRange}
      options={RATE_RANGES}
      ariaLabel="Rate sample range"
    />
  )

  const backAction = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={routeHref("connections")} />}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      Back to connections
    </Button>
  )

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
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href={routeHref("connections")} />}
                >
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
    )
  }

  if (loading || !connection) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={route.id ?? "Connection"}
          description="Loading connection details."
          actions={backAction}
        />
        <KpiSkeleton />
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
    )
  }

  const chartData = buildRateChartData(connection)
  const clientProperties = flattenProperties(connection.clientProperties)
  const garbageCollection = connection.garbageCollection
    ? flattenProperties(connection.garbageCollection).map(
        ([label, value]) =>
          [GC_PROPERTY_LABELS[label] ?? label, value] as [string, unknown]
      )
    : null
  const reductionsSamples = connection.reductionsRate
    ? chronological(connection.reductionsRate.samples)
    : []

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
          icon={<ArrowDownToLineIcon aria-hidden="true" />}
          spark={chronological(connection.recv.samples)}
        />
        <KpiCard
          label="Sending"
          value={fmtRate(connection.send.rate)}
          detail={`avg ${fmtRate(connection.send.avgRate)}`}
          tone="success"
          icon={<ArrowUpToLineIcon aria-hidden="true" />}
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
          icon={<ActivityIcon aria-hidden="true" />}
          spark={reductionsSamples}
        />
        <KpiCard
          label="Channels"
          value={fmtInt(connection.channels)}
          detail={`channel max ${orDash(connection.channelMax)}`}
          icon={<GitBranchIcon aria-hidden="true" />}
        />
      </KpiGrid>

      <SectionFrame
        title="Channels"
        description="Channels opened by this connection."
      >
        <ChannelsTable
          channels={channels}
          loading={channelsLoading}
          error={channelsError}
          onRetry={retryChannels}
        />
      </SectionFrame>

      <DetailLayout
        main={
          <>
            {chartData.length ? (
              <>
                <SectionFrame
                  title="Data rates"
                  description={`Octets received and sent per second over the ${RATE_WINDOWS[range]}.`}
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
                    description={`Reductions per second over the ${RATE_WINDOWS[range]}.`}
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
                  The broker did not report garbage collection statistics for
                  this connection.
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
                {
                  label: "Frame max",
                  value: `${fmtInt(connection.frameMax)} bytes`,
                },
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
                {
                  label: "TLS",
                  value: connection.ssl ? "Enabled" : "Plain text",
                },
                {
                  label: "SSL protocol",
                  value: orDash(connection.sslProtocol),
                },
                {
                  label: "Cipher",
                  value: orDash(connection.sslCipher),
                  mono: true,
                },
                {
                  label: "Key exchange",
                  value: orDash(connection.sslKeyExchange),
                },
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
                {
                  label: "Send pending",
                  value: `${fmtInt(connection.sendPending)} bytes`,
                },
              ]}
            />
            <FactPanel
              title="Activity"
              facts={[
                {
                  label: "Connected at",
                  value: fmtTimestamp(connection.connectedAt),
                },
                {
                  label: "Age",
                  value: fmtSince(connection.connectedAt, new Date().getTime()),
                },
                {
                  label: "Received",
                  value: `${fmtInt(connection.recvOct)} bytes`,
                },
                { label: "Sent", value: `${fmtInt(connection.sendOct)} bytes` },
                {
                  label: "Packets received",
                  value: fmtInt(connection.recvCount),
                },
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
          if (open) return
          setConfirmClose(false)
          setCloseReason("")
        }}
        title="Close connection?"
        description={`${connection.name} and its ${connection.channels} channels will be closed. Attached consumers stop receiving messages.`}
        confirmLabel="Close connection"
        tone="destructive"
        onConfirm={() => {
          const reason = closeReason
          setConfirmClose(false)
          setCloseReason("")
          closeConnection(reason)
            .then(() => {
              toast.success("Connection closed", {
                description: `${connection.name} was closed.`,
              })
              navigate(routeHref("connections"))
            })
            .catch((cause: unknown) => {
              toast.error("Connection was not closed", {
                description:
                  cause instanceof Error
                    ? cause.message
                    : "The management API did not respond.",
              })
            })
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
  )
}
