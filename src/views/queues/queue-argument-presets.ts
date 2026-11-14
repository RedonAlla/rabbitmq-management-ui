import type { QueueDeclarationType } from "@/lib/rabbit-api";
import type { ArgumentPreset } from "@/views/queues/queue-arguments";

const CLASSIC_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "auto-expire",
    label: "Auto expire",
    notes:
      "How long a queue can be unused for before it is automatically deleted (milliseconds).",
    args: [{ key: "x-expires", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#queue-ttl",
      label: '(Sets the "x-expires" argument.)'
    }
  },
  {
    id: "message-ttl",
    label: "Message TTL",
    notes: "Per-queue message expiry (ms)",
    args: [{ key: "x-message-ttl", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#per-queue-message-ttl",
      label: '(Sets the "x-message-ttl" argument.)'
    }
  },
  {
    id: "overflow",
    label: "Overflow behaviour",
    notes: "This determines what happens to messages when the maximum length of a queue is reached. Valid values are drop-head, reject-publish or reject-publish-dlx",
    args: [{ key: "x-overflow", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: '(Sets the queue overflow behaviour.)'
    }
  },
  {
    id: "single-active-consumer",
    label: "Single active consumer",
    notes: "If set, makes sure only one consumer at a time consumes from the queue and fails over to another registered consumer in case the active one is cancelled or dies.",
    args: [{ key: "x-single-active-consumer", type: "boolean", value: "true" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/consumers#single-active-consumer",
      label: '(Sets the "x-single-active-consumer" argument.)'
    }
  },
  {
    id: "dead-letter-exchange",
    label: "Dead letter exchange",
    notes: "Optional name of an exchange to which messages will be republished if they are rejected or expire.",
    args: [{ key: "x-dead-letter-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-exchange" argument.)'
    }
  },
  {
    id: "dead-letter-routing-key",
    label: "Dead letter routing key",
    notes: "Optional replacement routing key to use when a message is dead-lettered. If this is not set, the message's original routing key will be used.",
    args: [{ key: "x-dead-letter-routing-key", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-routing-key" argument.)'
    }
  },
  {
    id: "max-length",
    label: "Max length",
    notes: "How many (ready) messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length" argument.)'
    }
  },
  {
    id: "max-length-bytes",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "max-priority",
    label: "Maximum priority",
    notes: "Maximum number of priority levels for the queue to support; if not set, the queue will not support message priorities.",
    args: [{ key: "x-max-priority", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/priority",
      label: '(Sets the "x-max-priority" argument.)'
    }
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
];

const QUORUM_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "auto-expire",
    label: "Auto expire",
    notes:
      "How long a queue can be unused for before it is automatically deleted (milliseconds).",
    args: [{ key: "x-expires", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#queue-ttl",
      label: '(Sets the "x-expires" argument.)'
    }
  },
  {
    id: "message-ttl",
    label: "Message TTL",
    notes: "How long a message published to a queue can live before it is discarded (milliseconds).",
    args: [{ key: "x-message-ttl", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/ttl#per-queue-message-ttl",
      label: '(Sets the "x-message-ttl" argument.)'
    }
  },
  {
    id: "overflow",
    label: "Overflow behaviour",
    notes: "This determines what happens to messages when the maximum length of a queue is reached. Valid values for quorum queues are drop-head and reject-publish.",
    args: [{ key: "x-overflow", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: 'Sets the queue overflow behaviour'
    }
  },
  {
    id: "single-active-consumer",
    label: "Single active consumer",
    notes: "If set, makes sure only one consumer at a time consumes from the queue and fails over to another registered consumer in case the active one is cancelled or dies.",
    args: [{ key: "x-single-active-consumer", type: "boolean", value: "true" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength#overflow-behaviour",
      label: '(Sets the "x-single-active-consumer" argument.)'
    }
  },
  {
    id: "dead-letter-exchange",
    label: "Dead letter exchange",
    notes: "Optional name of an exchange to which messages will be republished if they are rejected or expire.",
    args: [{ key: "x-dead-letter-exchange", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-exchange" argument.)'
    }
  },
  {
    id: "dead-letter-routing-key",
    label: "Dead letter routing key",
    notes: "Optional replacement routing key to use when a message is dead-lettered. If this is not set, the message's original routing key will be used.",
    args: [{ key: "x-dead-letter-routing-key", type: "string", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/dlx",
      label: '(Sets the "x-dead-letter-routing-key" argument.)'
    }
  },
  {
    id: "dead-letter-strategy",
    label: "Dead letter strategy",
    notes: "Valid values are at-most-once or at-least-once. It defaults to at-most-once. If at-least-once is set, Overflow behaviour must be set to reject-publish. Otherwise, dead letter strategy will fall back to at-most-once.",
    args: [{ key: "x-dead-letter-strategy", type: "string", value: "at-most-once" }],
  },
  {
    id: "max-length",
    label: "Max length",
    notes: "How many (ready) messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [
      { key: "x-max-length", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length" argument.)'
    }
  },
  {
    id: "max-length",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [
      { key: "x-max-length-bytes", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "delivery-limit",
    label: "Delivery limit",
    notes: 'The number of allowed unsuccessful delivery attempts. Once a message has been delivered unsuccessfully more than this many times it will be dropped or dead-lettered, depending on the queue configuration. The default is always 20. A value of -1 sets the limit to "unlimited".',
    args: [{ key: "x-delivery-limit", type: "number", value: "20" }],
  },
  {
    id: "x-quorum-initial-group-size",
    label: "Initial cluster size",
    notes: "Set the queue initial cluster size, i.e. number of queue members/replicas",
    args: [{ key: "x-quorum-initial-group-size", type: "number", value: "3" }],
  },
  {
    id: "x-quorum-target-group-size",
    label: "Target cluster siz",
    notes: "The target number of replicas. Used by the periodic membership reconciliation mechanism.",
    args: [{ key: "x-quorum-target-group-size", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/quorum-queues#member-reconciliation",
      label: '(Sets "Continuous Membership Reconciliation (CMR)".)'
    }
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
  {
    id: "delayed-retry",
    label: "Delayed retry",
    notes: "The type of delayed retry for quorum queues. Valid values are all (retry all returned and failed messages), failed (retry only failed messages), returned (retry only returned messages), or disabled. You must also set delayed-retry-min for delayed retry to be enabled.",
    args: [
      { key: "x-delayed-retry-type", type: "string", value: "" },
      { key: "x-delayed-retry-min", type: "number", value: "" },
      { key: "x-delayed-retry-max", type: "number", value: "" },
    ],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "x-consumer-disconnected-timeout",
    label: "Consumer disconnected timeout",
    notes: 'How long to wait (in milliseconds) before returning checked out messages when a consumer\'s node becomes unreachable. Defaults to 60000 (60 seconds). (Sets the "x-consumer-disconnected-timeout" argument.)',
    args: [{ key: "x-consumer-disconnected-timeout", type: "number", value: "" }],
  },
  {
    id: "x-member-placement-tag",
    label: "Consumer disconnected timeout",
    notes: 'Node tag key used for AZ-aware quorum queue member placement. When set, replicas are spread across distinct values of this tag (e.g. az). Requires nodes to be tagged with the matching key via the node_tags configuration.',
    args: [{ key: "x-member-placement-tag", type: "string", value: "" }],
  },
];

const STREAM_ARGUMENT_PRESETS: ArgumentPreset[] = [
  {
    id: "max-length-bytes",
    label: "Max length bytes",
    notes: "Total body size for ready messages a queue can contain before it starts to drop them from its head or reject publishes, depending on the overflow behaviour.",
    args: [{ key: "x-max-length-bytes", type: "number", value: "" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/maxlength",
      label: '(Sets the "x-max-length-bytes" argument.)'
    }
  },
  {
    id: "max-age",
    label: "Max age",
    notes: "Sets the data retention for stream queues in time units (Y=Years, M=Months, D=Days, h=hours, m=minutes, s=seconds). E.g. \"1h\" configures the stream to only keep the last 1 hour of received messages.",
    args: [{ key: "x-max-age", type: "string", value: "7D" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the x-max-age argument.)'
    }
  },
  {
    id: "max-segment-size",
    label: "Max segment size in bytes",
    notes: "Size of each stream segment file",
    args: [
      { key: "x-stream-max-segment-size-bytes", type: "number", value: "500000000" },
    ],
  },
  {
    id: "initial-cluster-size",
    label: "Initial cluster size",
    notes: "Sets the data retention for stream queues in time units (Y=Years, M=Months, D=Days, h=hours, m=minutes, s=seconds). E.g. \"1h\" configures the stream to only keep the last 1 hour of received messages.",
    args: [{ key: "x-initial-cluster-size", type: "number", value: "3" }],
    doc: {
      href: "https://www.rabbitmq.com/docs/streams#declaring",
      label: '(Sets the x-max-age argument.)'
    }
  },
  {
    id: "filter-size",
    label: "Filter size (per chunk) in bytes",
    notes: "Size of the filter data attached to each stream chunk. (Sets the x-stream-filter-size-bytes argument.)",
    args: [{ key: "x-stream-filter-size-bytes", type: "number", value: "16" }],
  },
  {
    id: "leader-locator",
    label: "Leader locator",
    notes: "Set the rule by which the queue leader is located when declared on a cluster of nodes. Valid values are client-local (default) and balanced.",
    args: [{ key: "x-queue-leader-locator", type: "string", value: "" }],
  },
];

export const ARGUMENT_PRESETS: Record<QueueDeclarationType, ArgumentPreset[]> = {
  default: CLASSIC_ARGUMENT_PRESETS,
  classic: CLASSIC_ARGUMENT_PRESETS,
  quorum: QUORUM_ARGUMENT_PRESETS,
  stream: STREAM_ARGUMENT_PRESETS,
};
