import { useMemo, useState } from "react"
import { ArrowRightIcon, WaypointsIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionFrame } from "@/components/detail"
import { useCluster } from "@/store/cluster"
import { routeHref } from "@/lib/router"
import { fmtInt } from "@/lib/format"
import { routeTargets } from "@/lib/topology"
import type { Exchange } from "@/data/types"

export function ExchangeRoutingPreview({ exchange }: { exchange: Exchange }) {
  const { data } = useCluster()
  const [routingKey, setRoutingKey] = useState("")

  const targets = useMemo(
    () => routeTargets(exchange, routingKey, data.bindings, data.queues),
    [exchange, routingKey, data.bindings, data.queues]
  )

  return (
    <SectionFrame
      title="Routing preview"
      description="Try a routing key to see which queues receive the message."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="routing-preview">Routing key</Label>
          <Input
            id="routing-preview"
            value={routingKey}
            onChange={(event) => setRoutingKey(event.target.value)}
            placeholder={
              exchange.type === "topic" ? "orders.created.eu" : "orders.created"
            }
            className="font-mono"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <WaypointsIcon aria-hidden="true" className="size-3.5" />
          {targets.length
            ? `${targets.length} queue${targets.length === 1 ? "" : "s"} matched`
            : "No queue matches yet — type a key or check the bindings below."}
        </div>
        {targets.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {targets.map((target) => {
              const queue = data.queues.find(
                (entry) =>
                  entry.name === target && entry.vhost === exchange.vhost
              )
              return (
                <li key={target}>
                  <a
                    href={routeHref("queue", target)}
                    className="flex items-center justify-between gap-3 py-2 text-sm transition-colors hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="size-3.5 text-muted-foreground"
                      />
                      <span className="truncate font-medium">{target}</span>
                    </span>
                    <span className="data-cell shrink-0 text-xs text-muted-foreground">
                      {queue ? `${fmtInt(queue.ready)} ready` : "missing"}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </SectionFrame>
  )
}
