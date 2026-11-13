import { Badge } from "@/components/reui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Queue } from "@/data/types"

const FEATURES = [
  { key: "autoDelete", short: "AD", label: "Auto Delete" },
  { key: "durable", short: "D", label: "Durable" },
  { key: "exclusive", short: "Excl", label: "Exclusive" },
  { key: "internal", short: "Int", label: "Internal" },
] as const

export default function QueueFeatures({ queue }: { queue: Queue }) {
  const features = FEATURES.filter((feature) => queue[feature.key])

  if (!features.length) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {features.map((feature) => (
        <Tooltip key={feature.key}>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                tabIndex={0}
                aria-label={feature.label}
              >
                {feature.short}
              </Badge>
            }
          />
          <TooltipContent side="top">{feature.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
