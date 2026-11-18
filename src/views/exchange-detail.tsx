import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { RegionEmpty, RegionError } from "@/components/region-states"
import { KpiSkeleton } from "@/components/kpi-skeleton"
import {
  ExchangeArgumentsFrame,
  ExchangeBackButton,
  ExchangeBindingsFrame,
  ExchangeDetailHeader,
  ExchangeDetailSkeleton,
  ExchangeDetailsPanel,
  ExchangeKpis,
  ExchangeMessageRatesChart,
  ExchangeRoutingPreview,
} from "@/components/features/exchanges/details"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { ConditionalRender } from "@/components/conditional-render"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import type { ExchangeRateRange } from "@/lib/rabbit-api"
import { useExchangeDetail } from "@/hooks/use-exchange-detail"
import { NotFoundView } from "@/views/not-found"

export function ExchangeDetailView() {
  const { route, navigate } = useRoute()
  const {
    data,
    status: clusterStatus,
    error: clusterError,
    actions,
  } = useCluster()
  const { openDialog } = useDialogs()
  const [range, setRange] = useState<ExchangeRateRange>(60)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const routeName = route.id === "amq.default" ? "" : route.id
  const exchange = data.exchanges.find((entry) => entry.name === routeName)
  const displayName =
    route.id === "amq.default" ? "(default)" : (route.id ?? "unknown")

  const {
    detail,
    loading,
    error,
    status,
    retry: retryDetail,
  } = useExchangeDetail(exchange?.vhost, exchange?.name, range)

  const bindings = useMemo(
    () =>
      data.bindings.filter(
        (binding) =>
          binding.source === exchange?.name && binding.vhost === exchange?.vhost
      ),
    [data.bindings, exchange]
  )

  const publish = () => {
    if (!exchange) return
    openDialog({
      type: "publish",
      vhost: exchange.vhost,
      exchange: exchange.name,
    })
  }

  if (!exchange) {
    if (clusterStatus === "loading" && !clusterError) {
      return <ExchangeDetailSkeleton title={displayName} />
    }
    if (clusterError) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <PageHeader
            title={displayName}
            description="Could not resolve this exchange."
            actions={<ExchangeBackButton />}
          />
          <SectionFrame title="Exchange">
            <RegionError message={clusterError} onRetry={actions.retry} />
          </SectionFrame>
        </div>
      )
    }
    return (
      <NotFoundView
        title="Exchange not found"
        description={`No exchange named ${displayName} exists on this cluster.`}
      />
    )
  }

  if (error && !detail) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={exchange.name || "(default)"}
          description={
            status === 404
              ? "The broker does not know this exchange anymore."
              : "Could not load this exchange."
          }
          actions={<ExchangeBackButton />}
        />
        <SectionFrame title="Exchange">
          {status === 404 ? (
            <RegionEmpty
              title="Exchange not found"
              description={`No exchange named ${displayName} on virtual host ${exchange.vhost}. It may have been deleted.`}
              action={<ExchangeBackButton />}
            />
          ) : (
            <RegionError message={error} onRetry={retryDetail} />
          )}
        </SectionFrame>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ExchangeDetailHeader
        exchange={exchange}
        onDelete={() => setConfirmDelete(true)}
      />

      <ConditionalRender condition={detail !== null} default={<KpiSkeleton />}>
        <ExchangeKpis detail={detail!} bindings={bindings} />
      </ConditionalRender>

      <DetailLayout
        main={
          <>
            <ExchangeMessageRatesChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <ExchangeRoutingPreview exchange={exchange} />

            <ExchangeBindingsFrame bindings={bindings} onPublish={publish} />
          </>
        }
        side={
          <>
            <ExchangeDetailsPanel detail={detail} />

            <ExchangeArgumentsFrame
              args={detail?.arguments ?? exchange.args}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete exchange?"
        description={`This removes ${displayName} and every binding that leaves it. Bound queues keep their messages.`}
        confirmLabel="Delete exchange"
        tone="destructive"
        onConfirm={async () => {
          setConfirmDelete(false)
          try {
            await actions.deleteExchange(exchange.vhost, exchange.name)
            toast.success("Exchange deleted", {
              description: `${displayName} was removed.`,
            })
            navigate(routeHref("exchanges"))
          } catch (cause) {
            toast.error("Exchange was not deleted", {
              description:
                cause instanceof Error
                  ? cause.message
                  : "The management API did not respond.",
            })
          }
        }}
      />
    </div>
  )
}
