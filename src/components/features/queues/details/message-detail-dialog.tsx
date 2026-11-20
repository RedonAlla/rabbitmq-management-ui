import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DialogBody from "@/components/ui/dialog-body"
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockHeader,
  CodeBlockLanguage,
  CodeBlockTitle,
} from "@/components/reui/code-block/code-block"
import { PropertyList } from "@/components/property-list"
import { fmtBytes } from "@/lib/format"
import { flattenProperties } from "@/lib/properties"
import type { QueueMessage } from "@/lib/rabbit-api"

function formatPayload(message: QueueMessage): string {
  if (!message.payload) return "Empty payload"
  if (message.payloadEncoding !== "string") return message.payload
  try {
    return JSON.stringify(JSON.parse(message.payload), null, 2)
  } catch {
    return message.payload
  }
}

function payloadLanguage(message: QueueMessage): string {
  if (!message.payload || message.payloadEncoding !== "string") return "text"
  try {
    JSON.parse(message.payload)
    return "json"
  } catch {
    return "text"
  }
}

export function MessageDetailDialog({
  message,
  open,
  onOpenChange,
}: {
  message: QueueMessage | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const properties = useMemo(
    () => (message ? flattenProperties(message.properties) : []),
    [message]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Message</DialogTitle>
          <DialogDescription>
            {message
              ? `${message.exchange || "(default exchange)"} → ${
                  message.routingKey || "(empty)"
                } · ${fmtBytes(
                  message.payloadBytes || message.payload.length
                )}${message.redelivered ? " · redelivered" : ""}`
              : "Message details"}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex min-w-0 flex-col gap-1.5">
            <CodeBlock
              code={message ? formatPayload(message) : ""}
              language={message ? payloadLanguage(message) : "text"}
              showLineNumbers
            >
              <CodeBlockHeader>
                <CodeBlockTitle>
                  Payload
                  {message && message.payloadEncoding !== "string"
                    ? ` (${message.payloadEncoding})`
                    : ""}
                </CodeBlockTitle>
                <CodeBlockLanguage />
                <CodeBlockCopyButton className="ml-auto" />
              </CodeBlockHeader>
              <CodeBlockExpandButton />
            </CodeBlock>
          </div>

          <div className="flex min-h-0 flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Properties</span>
            <div className="max-h-64 overflow-auto">
              <PropertyList entries={properties} />
            </div>
          </div>
        </DialogBody>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
