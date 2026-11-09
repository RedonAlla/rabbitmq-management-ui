import { ActivityIcon } from "lucide-react"
import { SectionFrame } from "@/components/detail"
import { RegionEmpty } from "@/components/region-states"
import { Badge } from "@/components/reui/badge"
import type { ClusterEvent } from "@/data/types"
import { IS_DEMO } from "@/lib/env"
import { fmtAgo } from "@/lib/format"

type Props = {
  events: ClusterEvent[]
  live: boolean
}

const EVENT_TONE: Record<string, string> = {
  warn: "bg-warning",
  info: "bg-info",
  ok: "bg-success",
  error: "bg-destructive",
}

export default function RecentActivity({ events, live }: Props) {
  return (
    <SectionFrame
      title="Recent activity"
      description={
        IS_DEMO
          ? "Simulated events from the broker."
          : "Activity reported by the broker."
      }
      actions={
        live ? (
          <Badge variant="success-light">
            <span
              className="size-1.5 rounded-full bg-success"
              aria-hidden="true"
            />
            Live
          </Badge>
        ) : (
          <Badge variant="outline">Paused</Badge>
        )
      }
    >
      {events.length === 0 ? (
        <RegionEmpty
          title="No recent activity"
          description="The management API has not reported any cluster events."
          icon={<ActivityIcon />}
        />
      ) : (
        <ol className="flex flex-col divide-y divide-border">
          {events.slice(0, 5).map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${EVENT_TONE[event.type] ?? "bg-muted-foreground"}`}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {event.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtAgo(event.time, new Date().getTime())}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {event.detail}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  )
}
