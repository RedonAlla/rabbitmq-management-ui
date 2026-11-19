import { type Dispatch, type SetStateAction } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Vhost } from "@/data/types"
import { useCluster } from "@/store/cluster"
import { toast } from "sonner"

type Props = {
  pendingDelete: Vhost | null,
  setPendingDelete: Dispatch<SetStateAction<Vhost | null>>
  onConfirm?: () => void
}

export function DeleteVhostDialog({ pendingDelete, setPendingDelete, onConfirm }: Props) {
  const { actions } = useCluster()

  const handelConfirm = async () => {
    if (!pendingDelete)
      return

    setPendingDelete(null)

    try {
      await actions.deleteVhost(pendingDelete.name)
      toast.success("Virtual host deleted", {
        description: `${pendingDelete.name} was removed.`,
      })
      if(onConfirm)
        onConfirm()
    } catch (cause) {
      toast.error("Virtual host was not deleted", {
        description:
          cause instanceof Error
            ? cause.message
            : "The management API did not respond.",
      })
    }
  }
  
  return (
    <ConfirmDialog
      open={Boolean(pendingDelete)}
      onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
      title="Delete virtual host?"
      description={`${pendingDelete?.name ?? ""} is removed with its policies and limits. The cluster refuses the delete while queues, exchanges or connections remain.`}
      confirmLabel="Delete virtual host"
      tone="destructive"
      onConfirm={() => void handelConfirm()}
    />
  )
}