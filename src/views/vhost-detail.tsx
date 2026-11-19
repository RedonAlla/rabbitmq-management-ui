import { useState } from "react"
import { BoxesIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ConditionalRender } from "@/components/conditional-render"
import { RegionEmpty, RegionError } from "@/components/region-states"
import { KpiSkeleton } from "@/components/kpi-skeleton"
import {
  VhostBackButton,
  VhostClusterStatePanel,
  VhostDetailHeader,
  VhostDetailsPanel,
  VhostDetailSkeleton,
  VhostKpis,
  VhostMessageCountsChart,
  VhostMessageRatesChart,
  VhostPermissionsFrame,
} from "@/components/features/vhosts/details"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { useRoute, routeHref } from "@/lib/router"
import type { VhostRateRange } from "@/lib/rabbit-api"
import type { Vhost } from "@/data/types"
import { useVhostDetail } from "@/hooks/use-vhost-detail"

export function VhostDetailView() {
  const { route, navigate } = useRoute()
  const {
    data,
    status: clusterStatus,
    error: clusterError,
    actions,
  } = useCluster()
  const { openDialog } = useDialogs()
  const [range, setRange] = useState<VhostRateRange>(3600)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const vhost = data.vhosts.find((entry) => entry.name === route.id)
  const {
    detail,
    loading,
    error,
    status,
    retry: retryDetail,
  } = useVhostDetail(vhost?.name, range)

  if (!vhost) {
    if (clusterStatus === "loading" && !clusterError) {
      return <VhostDetailSkeleton title={route.id ?? "Virtual host"} />
    }
    if (clusterError) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <PageHeader
            title={route.id ?? "Virtual host"}
            description="Could not resolve this virtual host."
            actions={<VhostBackButton />}
          />
          <SectionFrame title="Virtual host">
            <RegionError message={clusterError} onRetry={actions.retry} />
          </SectionFrame>
        </div>
      )
    }
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Virtual host not found"
          description="The cluster does not list this virtual host."
          actions={<VhostBackButton />}
        />
        <SectionFrame title="Virtual host">
          <RegionEmpty
            title="Virtual host not found"
            description={`No virtual host named ${route.id ?? "unknown"} exists on this cluster.`}
            icon={<BoxesIcon />}
            action={<VhostBackButton />}
          />
        </SectionFrame>
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={vhost.name}
          description={
            status === 404
              ? "The broker does not know this virtual host anymore."
              : "Could not load this virtual host."
          }
          actions={<VhostBackButton />}
        />
        <SectionFrame title="Virtual host">
          {status === 404 ? (
            <RegionEmpty
              title="Virtual host not found"
              description={`No virtual host named ${vhost.name} exists on this cluster. It may have been deleted.`}
              icon={<BoxesIcon />}
              action={<VhostBackButton />}
            />
          ) : (
            <RegionError message={error} onRetry={retryDetail} />
          )}
        </SectionFrame>
      </div>
    )
  }

  const edit = () => {
    const target: Vhost = {
      name: vhost.name,
      description: detail?.description ?? vhost.description,
      defaultQueueType: detail?.defaultQueueType ?? vhost.defaultQueueType,
      protectedFromDeletion:
        detail?.protectedFromDeletion ?? vhost.protectedFromDeletion,
      tracing: detail?.tracing ?? vhost.tracing,
      tags: detail?.tags ?? vhost.tags,
      clusterState: detail?.clusterState ?? vhost.clusterState,
    }
    openDialog({ type: "edit-vhost", vhost: target })
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <VhostDetailHeader
        vhost={vhost}
        detail={detail}
        onEdit={edit}
        onDelete={() => setConfirmDelete(true)}
      />

      <ConditionalRender condition={detail !== null} default={<KpiSkeleton />}>
        <VhostKpis detail={detail!} />
      </ConditionalRender>

      <DetailLayout
        main={
          <>
            <VhostPermissionsFrame vhost={vhost.name} />
            <VhostMessageCountsChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />
            <VhostMessageRatesChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />
          </>
        }
        side={
          <>
            <VhostDetailsPanel detail={detail} />
            <VhostClusterStatePanel
              state={detail?.clusterState ?? vhost.clusterState}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete virtual host?"
        description={`${vhost.name} is removed with its policies and limits. The cluster refuses the delete while queues, exchanges or connections remain.`}
        confirmLabel="Delete virtual host"
        tone="destructive"
        onConfirm={async () => {
          setConfirmDelete(false)
          try {
            await actions.deleteVhost(vhost.name)
            toast.success("Virtual host deleted", {
              description: `${vhost.name} was removed.`,
            })
            navigate(routeHref("vhosts"))
          } catch (cause) {
            toast.error("Virtual host was not deleted", {
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