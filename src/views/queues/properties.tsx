import { RefreshCwIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyList } from "@/components/property-list";
import { SectionFrame } from "@/components/detail";
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states";
import { fmtInt } from "@/lib/format";
import type { QueueGarbageCollection } from "@/lib/rabbit-api";
import { ConditionalRender } from "@/components/conditional-render";

interface RegionProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function RetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
      <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
      Retry
    </Button>
  );
}

export function QueueArgumentsFrame({
  args,
  loading,
  error,
  onRetry,
}: RegionProps & { args: Record<string, unknown> }) {
  const entries = Object.entries(args);
  return (
    <SectionFrame
      title="Arguments"
      description="Arguments supplied when the queue was declared."
    >
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <RegionSkeleton rows={3} />
      ) : entries.length ? (
        <PropertyList entries={entries} />
      ) : (
        <RegionEmpty
          title="No arguments"
          description="This queue was declared without arguments."
          action={<RetryAction onRetry={onRetry} />}
        />
      )}
    </SectionFrame>
  );
}

export function QueuePolicyFrame({
  policy,
  operatorPolicy,
  definition,
  loading,
  error,
  onRetry,
}: RegionProps & {
  policy: string | null;
  operatorPolicy: string | null;
  definition: Record<string, unknown>;
}) {
  const entries = Object.entries(definition);
  return (
    <SectionFrame
      title="Effective policy"
      description="The policy this queue inherits and the definition it applies."
    >
      <ConditionalRender condition={error !== null}>
        <RegionError message={error!} onRetry={onRetry} />
      </ConditionalRender>

      <ConditionalRender condition={loading}>
        <RegionSkeleton rows={3} />
      </ConditionalRender>

      <ConditionalRender
        condition={Boolean(policy || operatorPolicy || entries.length)}
        default={
          <RegionEmpty
            title="No policy applied"
            description="No policy or operator policy matches this queue."
            icon={<ShieldIcon />}
            action={<RetryAction onRetry={onRetry} />}
          />
        }
      >
        <div className="flex flex-col gap-3">
          <PropertyList
            entries={[
              ["Policy", policy ?? "—"],
              ["Operator policy", operatorPolicy ?? "—"],
            ]}
          />
          <ConditionalRender
            condition={entries.length > 0}
            default={
              <p className="text-xs text-muted-foreground">
                This policy does not add any definition entries.
              </p>
            }
          >
            <PropertyList entries={entries} />
          </ConditionalRender>
        </div>
      </ConditionalRender>
    </SectionFrame>
  );
}

type GarbageCollectionItemProps = {
  fact: {
    label: string;
    value: number | null;
  }
}

function GarbageCollectionItem({fact}: GarbageCollectionItemProps)
{
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
      <dd className="data-cell text-right text-sm tabular-nums">
        {fact.value === null ? "—" : fmtInt(fact.value)}
      </dd>
    </div>
  );
}

export function QueueGarbageCollectionFrame({
  collection,
  loading,
  error,
  onRetry,
}: RegionProps & { collection: QueueGarbageCollection | null }) {
  const facts = collection
    ? [
        { label: "Number of minor GCs (minor_gcs)", value: collection.minorGcs },
        {
          label:
            "Maximum generational collections before fullsweep (fullsweep_after)",
          value: collection.fullsweepAfter,
        },
        {
          label: "Maximum heap size in words (max_heap_size)",
          value: collection.maxHeapSize,
        },
        {
          label: "Minimum heap size in words (min_heap_size)",
          value: collection.minHeapSize,
        },
        {
          label:
            "Minimum binary virtual heap size in words (min_bin_vheap_size)",
          value: collection.minBinVheapSize,
        },
      ]
    : [];

  return (
    <SectionFrame
      title="Garbage collection"
      description="Erlang garbage collection statistics reported for the queue process."
    >
      <ConditionalRender condition={error !== null}>
        <RegionError message={error!} onRetry={onRetry} />
      </ConditionalRender>

      <ConditionalRender condition={loading}>
        <RegionSkeleton rows={5} />
      </ConditionalRender>

      <ConditionalRender
        condition={collection !== null}
        default={
          <RegionEmpty
            title="No garbage collection statistics"
            description="The broker did not report garbage collection for this queue."
            action={<RetryAction onRetry={onRetry} />}
          />
        }
      >
        <dl className="flex flex-col divide-y divide-border">
          {facts.map((fact) => (
            <GarbageCollectionItem key={fact.label} fact={fact} />
          ))}
        </dl>
      </ConditionalRender>
    </SectionFrame>
  );
}
