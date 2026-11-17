import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Dispatch } from "react"
import { fmtInt } from "@/lib/format"
import type { ConfirmState, Kind } from "./types"
import type { Queue } from "@/data/types"
import { Case, Switch } from "@/components/conditional-render"

type Props = {
  confirm: ConfirmState
  setConfirm: Dispatch<ConfirmState>
  confirmQueue: () => Promise<void>
}

const titleMapper: Record<Kind, string> = {
  purge: "Purge queue?",
  delete: "Delete queue?",
}

const confirmLabelMapper: Record<Kind, string> = {
  purge: "Purge messages",
  delete: "Delete queue",
}

const toneMapper: Record<Kind, "default" | "destructive"> = {
  purge: "default",
  delete: "destructive",
}

function PurgeDescription({ queue }: { queue: Queue }): React.ReactNode {
  return (
    <p>
      This removes{" "}
      <span className="truncate font-medium">{fmtInt(queue.ready)}</span> ready
      messages from{" "}
      <span className="truncate text-sm font-medium">{queue.name}</span>.
      Consumers stay attached.
    </p>
  )
}

function DeleteDescription({ queue }: { queue: Queue }): React.ReactNode {
  return (
    <p>
      This permanently deletes {queue.name ?? ""} with its bindings and
      consumers.
    </p>
  )
}

export function QueueConfirmDialog({
  confirm,
  setConfirm,
  confirmQueue,
}: Props) {
  return (
    <ConfirmDialog
      open={Boolean(confirm)}
      onOpenChange={(open) => (open ? undefined : setConfirm(null))}
      title={titleMapper[confirm?.kind!]}
      description={
        <Switch condition={confirm?.kind!}>
          <Case value="purge">
            <PurgeDescription queue={confirm?.queue!} />
          </Case>
          <Case value="delete">
            <DeleteDescription queue={confirm?.queue!} />
          </Case>
        </Switch>
      }
      confirmLabel={confirmLabelMapper[confirm?.kind!]}
      tone={toneMapper[confirm?.kind!]}
      onConfirm={confirmQueue}
    />
  )
}
