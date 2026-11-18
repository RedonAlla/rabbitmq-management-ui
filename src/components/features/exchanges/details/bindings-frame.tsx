import { ArrowRightIcon, GitBranchIcon, SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionFrame } from "@/components/detail"
import { RegionEmpty } from "@/components/region-states"
import { bindingSummary, fmtInt } from "@/lib/format"
import { routeHref } from "@/lib/router"
import { useCluster } from "@/store/cluster"
import type { Binding } from "@/data/types"
import { ConditionalRender } from "@/components/conditional-render"

interface Props {
  bindings: Binding[]
  onPublish: () => void
}

export function ExchangeBindingsFrame({ bindings, onPublish }: Props) {
  const { data } = useCluster()

  return (
    <SectionFrame
      title="Bindings"
      description={`${bindings.length} ${bindings.length === 1 ? "binding leaves" : "bindings leave"} this exchange.`}
    >
      <ConditionalRender
        condition={Boolean(bindings.length)}
        default={
          <RegionEmpty
            title="No bindings"
            description="Published messages are dropped unless an alternate exchange is configured."
            icon={<GitBranchIcon />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPublish}
              >
                <SendIcon data-icon="inline-start" aria-hidden="true" />
                Publish a message
              </Button>
            }
          />
        }
      >
        <ul className="flex flex-col divide-y divide-border">
          {bindings.map((binding) => {
            const queue = data.queues.find(
              (entry) =>
                entry.name === binding.destination &&
                entry.vhost === binding.vhost
            )
            return (
              <li
                key={`${binding.destination}-${binding.routingKey}-${binding.destType}`}
                className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                  <span className="data-cell">
                    {binding.routingKey || "(empty)"}
                  </span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                  <a
                    href={routeHref(
                      binding.destType === "queue" ? "queue" : "exchange",
                      binding.destination || "amq.default"
                    )}
                    className="truncate font-medium transition-colors hover:text-primary"
                  >
                    {binding.destination || "(default)"}
                  </a>
                </div>
                <span className="text-xs text-muted-foreground">
                  {binding.destType} ·{" "}
                  {queue ? `${fmtInt(queue.ready)} ready` : "no queue data"}
                  {Object.keys(binding.args).length
                    ? ` · ${bindingSummary(binding.args)}`
                    : ""}
                </span>
              </li>
            )
          })}
        </ul>
      </ConditionalRender>
    </SectionFrame>
  )
}
