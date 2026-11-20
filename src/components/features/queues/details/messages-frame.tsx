import { useEffect, useState } from "react"
import {
  EyeIcon,
  InboxIcon,
  MessageSquareIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQueueMessages } from "@/hooks/use-queue-messages"
import { fmtBytes, fmtInt, fmtTimestamp } from "@/lib/format"
import type { QueueMessage, QueueMessageCount } from "@/lib/rabbit-api"
import { MessageDetailDialog } from "./message-detail-dialog"

const MESSAGE_COUNTS: QueueMessageCount[] = [10, 25, 50]

function payloadPreview(payload: string): string {
  const compact = payload.replace(/\s+/g, " ").trim()
  return compact || "Empty payload"
}

function receivedAt(properties: Record<string, unknown>): string {
  const raw = properties.timestamp
  if (typeof raw === "number") return fmtTimestamp(raw * 1000)
  if (typeof raw === "string" && raw.trim() !== "") {
    const seconds = Number(raw)
    return Number.isFinite(seconds)
      ? fmtTimestamp(seconds * 1000)
      : fmtTimestamp(raw)
  }
  return "—"
}

type Props = {
  vhost: string
  queue: string
  ready: number
}

export function QueueMessagesFrame({ vhost, queue, ready }: Props) {
  const { messages, loading, error, count, setCount, load } =
    useQueueMessages(vhost, queue)
  const [selected, setSelected] = useState<QueueMessage | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [vhost, queue])

  const loadButton = (label: string) => (
    <Button type="button" variant="outline" size="sm" onClick={load}>
      <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
      {label}
    </Button>
  )

  return (
    <>
      <SectionFrame
        title="Messages"
        description={`Sample up to ${count} messages from the head of the queue. Fetched messages are requeued, so nothing is consumed.`}
        actions={
          <>
            <Select
              value={String(count)}
              onValueChange={(next) =>
                setCount(Number(next) as QueueMessageCount)
              }
            >
              <SelectTrigger size="sm" aria-label="Messages to fetch">
                <SelectValue>{`${count} messages`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_COUNTS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} messages
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              {loading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {messages ? "Refresh" : "Load messages"}
            </Button>
          </>
        }
        bodyClassName={messages?.length ? "p-0" : undefined}
      >
        {error ? <RegionError message={error} onRetry={load} /> : null}

        {loading ? (
          <RegionSkeleton rows={4} />
        ) : messages === null ? (
          <RegionEmpty
            title="Messages not loaded"
            description="Fetch a sample from the front of the queue. The broker requeues every message it returns."
            icon={<MessageSquareIcon />}
            action={loadButton("Load messages")}
          />
        ) : messages.length === 0 ? (
          <RegionEmpty
            title="No messages"
            description={
              ready > 0
                ? `${fmtInt(ready)} messages are ready but the broker returned none. Try again in a moment.`
                : "This queue has no ready messages right now."
            }
            icon={<InboxIcon />}
            action={loadButton("Refresh")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Routing key</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message, index) => (
                <TableRow key={`${message.routingKey}-${index}`}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="data-cell block max-w-[30rem] truncate text-xs">
                        {payloadPreview(message.payload)}
                      </span>
                      {message.redelivered ? (
                        <Badge variant="warning-light" className="w-fit">
                          Redelivered
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {message.exchange || "(default)"}
                  </TableCell>
                  <TableCell className="data-cell text-xs">
                    {message.routingKey || "(empty)"}
                  </TableCell>
                  <TableCell className="data-cell text-right text-xs tabular-nums">
                    {fmtBytes(
                      message.payloadBytes || message.payload.length
                    )}
                  </TableCell>
                  <TableCell className="data-cell text-right text-xs">
                    {receivedAt(message.properties)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="View message"
                      onClick={() => setSelected(message)}
                    >
                      <EyeIcon aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionFrame>

      <MessageDetailDialog
        message={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
