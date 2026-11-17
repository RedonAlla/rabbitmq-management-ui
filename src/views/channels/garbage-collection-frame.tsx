import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import { fmtInt } from "@/lib/format"
import type { ChannelGarbageCollection } from "@/lib/rabbit-api"

type Props = {
  collection: ChannelGarbageCollection | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

function gcValue(value: number | null): string {
  return value === null ? "—" : fmtInt(value)
}

export default function GarbageCollectionFrame({
  collection,
  loading,
  error,
  onRetry,
}: Props) {
  return (
    <SectionFrame
      title="Garbage collection"
      description="Erlang garbage collection statistics reported for the channel process."
    >
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <RegionSkeleton rows={5} />
      ) : collection ? (
        <dl className="flex flex-col divide-y divide-border">
          {[
            {
              label: "Number of minor GCs (minor_gcs)",
              value: collection.minorGcs,
            },
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
          ].map((fact) => (
            <div
              key={fact.label}
              className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
            >
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="data-cell text-right text-sm tabular-nums">
                {gcValue(fact.value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <RegionEmpty
          title="No garbage collection statistics"
          description="The broker did not report garbage collection statistics for this channel."
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              Retry
            </Button>
          }
        />
      )}
    </SectionFrame>
  )
}
