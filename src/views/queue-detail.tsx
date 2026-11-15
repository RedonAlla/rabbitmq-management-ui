import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DetailLayout, SectionFrame } from "@/components/detail";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RegionEmpty, RegionError } from "@/components/region-states";
import {
  AddBindingDialog,
  MessageRatesChart,
  QueueBackButton,
  QueueCountersPanel,
  QueueDepthChart,
  QueueDetailHeader,
  QueueDetailSkeleton,
  QueueDetailsPanel,
  QueueKpis,
  QueueLifecyclePanel,
  QueueStoragePanel,
  ReductionsChart,
} from "@/components/features/queues/details";
import { KpiSkeleton } from "@/components/kpi-skeleton";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt } from "@/lib/format";
import type { QueueRateRange } from "@/lib/rabbit-api";
import { useQueueDetail } from "@/hooks/use-queue-detail";
import QueueConsumersTable from "@/views/queues/consumers-table";
import QueueBindingsFrame from "@/views/queues/bindings-frame";
import {
  QueueArgumentsFrame,
  QueueGarbageCollectionFrame,
  QueuePolicyFrame,
} from "@/views/queues/properties";
import { NotFoundView } from "@/views/not-found";

export function QueueDetailView() {
  const { route, navigate } = useRoute();
  const {
    data,
    status: clusterStatus,
    error: clusterError,
    actions,
  } = useCluster();
  const [range, setRange] = useState<QueueRateRange>(600);
  const [confirm, setConfirm] = useState<"purge" | "delete" | null>(null);
  const [bindingOpen, setBindingOpen] = useState(false);

  const queue = data.queues.find((entry) => entry.name === route.id);
  const {
    detail,
    loading,
    error,
    status,
    retry: retryDetail,
  } = useQueueDetail(queue?.vhost, route.id, range);

  const bindings = useMemo(
    () =>
      data.bindings.filter(
        (binding) =>
          binding.destination === queue?.name && binding.vhost === queue?.vhost
      ),
    [data.bindings, queue]
  );

  if (!queue) {
    if (clusterStatus === "loading" && !clusterError) {
      return <QueueDetailSkeleton title={route.id ?? "Queue"} />;
    }
    if (clusterError) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <PageHeader
            title={route.id ?? "Queue"}
            description="Could not resolve this queue."
            actions={<QueueBackButton />}
          />
          <SectionFrame title="Queue">
            <RegionError message={clusterError} onRetry={actions.retry} />
          </SectionFrame>
        </div>
      );
    }
    return (
      <NotFoundView
        title="Queue not found"
        description={`No queue named ${route.id ?? "unknown"} exists on this cluster.`}
      />
    );
  }

  if (error && !detail) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title={queue.name}
          description={
            status === 404
              ? "The broker does not know this queue anymore."
              : "Could not load this queue."
          }
          actions={<QueueBackButton />}
        />
        <SectionFrame title="Queue">
          {status === 404 ? (
            <RegionEmpty
              title="Queue not found"
              description={`No queue named ${queue.name} on virtual host ${queue.vhost}. It may have been deleted.`}
              action={<QueueBackButton />}
            />
          ) : (
            <RegionError message={error} onRetry={retryDetail} />
          )}
        </SectionFrame>
      </div>
    );
  }

  const confirmAction = async () => {
    const ready = detail?.messagesReady ?? queue.ready;
    if (confirm === "purge") {
      try {
        await actions.purgeQueue(queue.vhost, queue.name);
        toast.success("Queue purged", {
          description: `${fmtInt(ready)} messages removed from ${queue.name}.`,
        });
        retryDetail();
      } catch (cause) {
        toast.error("Queue was not purged", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        });
      }
    }
    if (confirm === "delete") {
      try {
        await actions.deleteQueue(queue.vhost, queue.name);
        toast.success("Queue deleted", {
          description: `${queue.name} was removed.`,
        });
        navigate(routeHref("queues"));
      } catch (cause) {
        toast.error("Queue was not deleted", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        });
      }
    }
    setConfirm(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <QueueDetailHeader
        queue={queue}
        detail={detail}
        onPurge={() => setConfirm("purge")}
        onDelete={() => setConfirm("delete")}
        onAddBinding={() => setBindingOpen(true)}
      />

      {detail ? <QueueKpis detail={detail} /> : <KpiSkeleton />}

      <QueueConsumersTable
        consumers={detail?.consumerDetails ?? []}
        loading={loading}
        error={error}
        onRetry={retryDetail}
      />

      <DetailLayout
        main={
          <>
            <QueueDepthChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <MessageRatesChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <QueueBindingsFrame
              bindings={bindings}
              onAddBinding={() => setBindingOpen(true)}
            />

            <ReductionsChart
              detail={detail}
              range={range}
              setRange={setRange}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />

            <QueueGarbageCollectionFrame
              collection={detail?.garbageCollection ?? null}
              loading={loading}
              error={error}
              onRetry={retryDetail}
            />
          </>
        }
        side={
          <>
            <QueueDetailsPanel detail={detail} />

            {detail ? (
              <QueueArgumentsFrame
                args={detail.arguments}
                loading={loading}
                error={error}
                onRetry={retryDetail}
              />
            ) : null}

            <QueueLifecyclePanel detail={detail} />
            <QueueCountersPanel detail={detail} />
            <QueueStoragePanel detail={detail} />

            {detail ? (
              <QueuePolicyFrame
                policy={detail.policy}
                operatorPolicy={detail.operatorPolicy}
                definition={detail.effectivePolicyDefinition}
                loading={loading}
                error={error}
                onRetry={retryDetail}
              />
            ) : null}
          </>
        }
      />

      <AddBindingDialog
        open={bindingOpen}
        onClose={() => setBindingOpen(false)}
        vhost={queue.vhost}
        queue={queue.name}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm === "purge" ? "Purge queue?" : "Delete queue?"}
        description={
          confirm === "purge"
            ? `This removes ${fmtInt(
                detail?.messagesReady ?? queue.ready
              )} ready messages from ${queue.name}. Consumers stay attached.`
            : `This permanently deletes ${queue.name} with its bindings and consumers.`
        }
        confirmLabel={confirm === "purge" ? "Purge messages" : "Delete queue"}
        tone={confirm === "delete" ? "destructive" : "default"}
        onConfirm={confirmAction}
      />
    </div>
  );
}
