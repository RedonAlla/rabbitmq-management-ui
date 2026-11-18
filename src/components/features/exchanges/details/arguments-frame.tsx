import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyList } from "@/components/property-list"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"

interface Props {
  args: Record<string, unknown>
  loading: boolean
  error: string | null
  onRetry: () => void
}

function RetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
      <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
      Retry
    </Button>
  )
}

export function ExchangeArgumentsFrame({
  args,
  loading,
  error,
  onRetry,
}: Props) {
  const entries = Object.entries(args)
  return (
    <SectionFrame
      title="Arguments"
      description="Arguments supplied when the exchange was declared."
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
          description="This exchange was declared without arguments."
          action={<RetryAction onRetry={onRetry} />}
        />
      )}
    </SectionFrame>
  )
}
