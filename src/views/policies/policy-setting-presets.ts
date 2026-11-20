import type { ArgumentType } from "@/lib/arguments"

export type PolicySettingGroup =
  | "All queues"
  | "Classic queues"
  | "Quorum queues"
  | "Streams"
  | "Exchanges"

export type PolicySettingPreset = {
  id: string
  label: string
  group: PolicySettingGroup
  notes: string
  operator: boolean
  args: { key: string; type: ArgumentType; value: string }[]
  doc?: { href: string; label: string }
}

export const POLICY_SETTING_PRESETS: PolicySettingPreset[] = [
  {
    id: "message-ttl",
    label: "Message TTL",
    group: "All queues",
    notes: "Discard messages after this many milliseconds in the queue.",
    operator: true,
    args: [{ key: "message-ttl", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl",
      label: '(Sets the "message-ttl" setting.)',
    },
  },
  {
    id: "expires",
    label: "Queue expiry",
    group: "All queues",
    notes: "Delete the queue after this many milliseconds without use.",
    operator: true,
    args: [{ key: "expires", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#queue-ttl",
      label: '(Sets the "expires" setting.)',
    },
  },
  {
    id: "max-length",
    label: "Max length",
    group: "All queues",
    notes:
      "Maximum number of ready messages before the overflow behaviour applies.",
    operator: true,
    args: [{ key: "max-length", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "max-length" setting.)',
    },
  },
  {
    id: "max-length-bytes",
    label: "Max length bytes",
    group: "All queues",
    notes:
      "Maximum total size of ready messages before the overflow behaviour applies.",
    operator: true,
    args: [{ key: "max-length-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "max-length-bytes" setting.)',
    },
  },
  {
    id: "overflow",
    label: "Overflow behaviour",
    group: "All queues",
    notes:
      "At the length limit, drop from the head, reject new publishes, or reject and dead-letter them.",
    operator: true,
    args: [{ key: "overflow", type: "string", value: "drop-head" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: '(Sets the "overflow" setting.)',
    },
  },
  {
    id: "queue-leader-locator",
    label: "Queue leader locator",
    group: "All queues",
    notes:
      "Place the leader on the client-local node, balance it, or use random / least-leaders.",
    operator: false,
    args: [{ key: "queue-leader-locator", type: "string", value: "balanced" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/queues",
      label: '(Sets the "queue-leader-locator" setting.)',
    },
  },
  {
    id: "dead-letter-exchange",
    label: "Dead letter exchange",
    group: "All queues",
    notes: "Exchange that receives rejected, expired, or overflowed messages.",
    operator: false,
    args: [{ key: "dead-letter-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "dead-letter-exchange" setting.)',
    },
  },
  {
    id: "dead-letter-routing-key",
    label: "Dead letter routing key",
    group: "All queues",
    notes: "Routing key used when dead-lettering; defaults to the original key.",
    operator: false,
    args: [{ key: "dead-letter-routing-key", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "dead-letter-routing-key" setting.)',
    },
  },
  {
    id: "dead-letter-strategy",
    label: "Dead letter strategy",
    group: "All queues",
    notes:
      "at-most-once or at-least-once; at-least-once requires reject-publish overflow.",
    operator: false,
    args: [
      { key: "dead-letter-strategy", type: "string", value: "at-most-once" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "dead-letter-strategy" setting.)',
    },
  },
  {
    id: "queue-mode",
    label: "Queue mode",
    group: "Classic queues",
    notes: "Default or lazy: lazy classic queues move messages to disk early.",
    operator: false,
    args: [{ key: "queue-mode", type: "string", value: "lazy" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/lazy-queues",
      label: '(Sets the "queue-mode" setting.)',
    },
  },
  {
    id: "queue-version",
    label: "Queue version",
    group: "Classic queues",
    notes: "Classic queue implementation version, 1 or 2.",
    operator: true,
    args: [{ key: "queue-version", type: "number", value: "2" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/queues",
      label: '(Sets the "queue-version" setting.)',
    },
  },
  {
    id: "consumer-timeout",
    label: "Consumer timeout",
    group: "Quorum queues",
    notes: "Cancel an idle consumer after this many milliseconds.",
    operator: false,
    args: [{ key: "consumer-timeout", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/consumers",
      label: '(Sets the "consumer-timeout" setting.)',
    },
  },
  {
    id: "consumer-disconnected-timeout",
    label: "Consumer disconnected timeout",
    group: "Quorum queues",
    notes:
      "Requeue checked-out messages after this many milliseconds when a consumer's node is unreachable.",
    operator: false,
    args: [
      { key: "consumer-disconnected-timeout", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/consumers",
      label: '(Sets the "consumer-disconnected-timeout" setting.)',
    },
  },
  {
    id: "max-in-memory-length",
    label: "Max in-memory length",
    group: "Quorum queues",
    notes: "Maximum number of messages kept in memory.",
    operator: true,
    args: [{ key: "max-in-memory-length", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues",
      label: '(Sets the "max-in-memory-length" setting.)',
    },
  },
  {
    id: "max-in-memory-bytes",
    label: "Max in-memory bytes",
    group: "Quorum queues",
    notes: "Maximum bytes of messages kept in memory.",
    operator: true,
    args: [{ key: "max-in-memory-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues",
      label: '(Sets the "max-in-memory-bytes" setting.)',
    },
  },
  {
    id: "delivery-limit",
    label: "Delivery limit",
    group: "Quorum queues",
    notes:
      "Unsuccessful deliveries allowed before a message is dropped or dead-lettered; -1 means unlimited.",
    operator: true,
    args: [{ key: "delivery-limit", type: "number", value: "20" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues",
      label: '(Sets the "delivery-limit" setting.)',
    },
  },
  {
    id: "target-group-size",
    label: "Target group size",
    group: "Quorum queues",
    notes: "Target replica count used by membership reconciliation.",
    operator: true,
    args: [{ key: "target-group-size", type: "number", value: "3" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues#member-reconciliation",
      label: '(Sets the "target-group-size" setting.)',
    },
  },
  {
    id: "member-placement-tag",
    label: "Member placement tag",
    group: "Quorum queues",
    notes: "Node tag used to spread replicas across availability zones.",
    operator: true,
    args: [{ key: "member-placement-tag", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues",
      label: '(Sets the "member-placement-tag" setting.)',
    },
  },
  {
    id: "delayed-retry",
    label: "Delayed retry",
    group: "Quorum queues",
    notes:
      "Retry returned or failed messages with a backoff between the minimum and maximum delay (ms).",
    operator: true,
    args: [
      { key: "delayed-retry-type", type: "string", value: "all" },
      { key: "delayed-retry-min", type: "number", value: "1000" },
      { key: "delayed-retry-max", type: "number", value: "10000" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues",
      label: "(Sets the delayed retry settings.)",
    },
  },
  {
    id: "max-age",
    label: "Max age",
    group: "Streams",
    notes: "Retention period for stream messages, e.g. 7D, 12h, 30m.",
    operator: false,
    args: [{ key: "max-age", type: "string", value: "7D" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the "max-age" setting.)',
    },
  },
  {
    id: "stream-max-segment-size-bytes",
    label: "Stream max segment size",
    group: "Streams",
    notes: "Maximum size of each stream segment file in bytes.",
    operator: false,
    args: [
      {
        key: "stream-max-segment-size-bytes",
        type: "number",
        value: "500000000",
      },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams",
      label: '(Sets the "stream-max-segment-size-bytes" setting.)',
    },
  },
  {
    id: "stream-filter-size-bytes",
    label: "Stream filter size",
    group: "Streams",
    notes: "Filter data size per stream chunk, from 16 to 255 bytes.",
    operator: false,
    args: [{ key: "stream-filter-size-bytes", type: "number", value: "16" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams",
      label: '(Sets the "stream-filter-size-bytes" setting.)',
    },
  },
  {
    id: "initial-cluster-size",
    label: "Initial cluster size",
    group: "Streams",
    notes: "Number of initial stream members/replicas.",
    operator: false,
    args: [{ key: "initial-cluster-size", type: "number", value: "3" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the "initial-cluster-size" setting.)',
    },
  },
  {
    id: "alternate-exchange",
    label: "Alternate exchange",
    group: "Exchanges",
    notes: "Exchange that receives messages this exchange cannot route.",
    operator: false,
    args: [{ key: "alternate-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ae",
      label: '(Sets the "alternate-exchange" setting.)',
    },
  },
]

export const OPERATOR_POLICY_SETTING_PRESETS = POLICY_SETTING_PRESETS.filter(
  (preset) => preset.operator
)
