import { Badge } from "@/components/reui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Queue } from "@/data/types"

interface Feature {
  short: string
  name: string
  description: string
}

const DEDICATED_ARGS = new Set([
  "x-message-ttl",
  "x-expires",
  "x-max-length",
  "x-max-length-bytes",
  "x-dead-letter-exchange",
  "x-dead-letter-routing-key",
  "x-max-priority",
  "x-overflow",
  "x-queue-type",
])

function queueFeatures(queue: Queue): Feature[] {
  const args = queue.args
  const hasArg = (key: string) => key in args
  const candidates: Array<Feature & { active: boolean }> = [
    {
      short: "D",
      name: "Durable",
      description:
        "Queue definition survives a broker restart. Messages survive only if published as persistent.",
      active: queue.durable,
    },
    {
      short: "AD",
      name: "Auto-delete",
      description: "Queue is deleted when its last consumer unsubscribes.",
      active: queue.autoDelete,
    },
    {
      short: "Excl",
      name: "Exclusive",
      description:
        "Usable only by the declaring connection; deleted when that connection closes.",
      active: queue.exclusive,
    },
    {
      short: "TTL",
      name: "Message TTL",
      description: "Messages expire after the specified time (ms).",
      active: hasArg("x-message-ttl"),
    },
    {
      short: "Exp",
      name: "Queue expiry",
      description:
        "Queue is deleted after being unused for the specified time (ms).",
      active: hasArg("x-expires"),
    },
    {
      short: "Lim B",
      name: "Max length",
      description:
        "Limits the number of messages and/or total size of the queue.",
      active: hasArg("x-max-length") || hasArg("x-max-length-bytes"),
    },
    {
      short: "DLX",
      name: "Dead letter exchange",
      description:
        "Exchange to which rejected, expired, or overflowed messages are republished.",
      active: hasArg("x-dead-letter-exchange"),
    },
    {
      short: "DLK",
      name: "Dead letter routing key",
      description: "Routing key used when dead-lettering messages.",
      active: hasArg("x-dead-letter-routing-key"),
    },
    {
      short: "Pri",
      name: "Priority",
      description: "Enables message priorities up to the given maximum level.",
      active: hasArg("x-max-priority"),
    },
    {
      short: "Ovfl",
      name: "Overflow behaviour",
      description:
        "Behaviour when max length is reached (drop-head, reject-publish, reject-publish-dlx).",
      active: hasArg("x-overflow"),
    },
    {
      short: "DR",
      name: "Delayed retry",
      description:
        "Returned messages are held back with a backoff before redelivery.",
      active: queue.type == "quorum",
    },
    {
      short: "Args",
      name: "Other arguments",
      description:
        "Queue has additional custom arguments without a dedicated short flag.",
      active: Object.keys(args).some((key) => !DEDICATED_ARGS.has(key)),
    },
  ]

  return candidates
    .filter((feature) => feature.active)
    .map(({ short, name, description }) => ({ short, name, description }))
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <Tooltip key={feature.short}>
      <TooltipTrigger
        render={
          <Badge variant="outline" tabIndex={0} aria-label={feature.name}>
            {feature.short}
          </Badge>
        }
      />
      <TooltipContent
        side="top"
        className="max-w-72 flex-col items-start gap-1"
      >
        <span className="font-medium">{feature.name}</span>
        <span className="opacity-80">{feature.description}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export default function QueueFeatures({ queue }: { queue: Queue }) {
  const features = queueFeatures(queue)

  if (!features.length) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1">
      {features.map((feature) => (
        <FeatureItem key={feature.short} feature={feature} />
      ))}
    </div>
  )
}
