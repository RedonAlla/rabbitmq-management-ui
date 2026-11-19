import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DialogBody from "@/components/ui/dialog-body"
import Field from "@/components/ui/field"
import FormError from "@/components/ui/form-error"
import { Input } from "@/components/ui/input"
import { useCluster } from "@/store/cluster"
import type { VhostTopicPermission } from "@/lib/rabbit-api"

export function EditVhostTopicPermissionDialog({
  open,
  vhost,
  permission,
  onClose,
  onSaved,
}: {
  open: boolean
  vhost: string
  permission: VhostTopicPermission | null
  onClose: () => void
  onSaved?: () => void
}) {
  const { actions } = useCluster()
  const [write, setWrite] = useState(permission?.write ?? "")
  const [read, setRead] = useState(permission?.read ?? "")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!permission) return

    try {
      await actions.updateUserTopicPermission({
        username: permission.user,
        vhost,
        exchange: permission.exchange,
        write,
        read,
      })

      toast.success("Topic permission updated", {
        description: `${permission.user} on ${
          permission.exchange || "all exchanges"
        } in ${vhost}.`,
      })
      setError("")
      onSaved?.()
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The management API did not respond."
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit topic permission</DialogTitle>
            <DialogDescription>
              Write and read patterns for {permission?.user ?? "this user"} on{" "}
              {permission?.exchange || "all exchanges"} in {vhost}.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Write" htmlFor="edit-topic-permission-write">
              <Input
                id="edit-topic-permission-write"
                className="data-cell"
                value={write}
                onChange={(event) => {
                  setWrite(event.target.value)
                  setError("")
                }}
                placeholder=".*"
                autoFocus
              />
            </Field>
            <Field label="Read" htmlFor="edit-topic-permission-read">
              <Input
                id="edit-topic-permission-read"
                className="data-cell"
                value={read}
                onChange={(event) => {
                  setRead(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Patterns are regular expressions matched against routing keys.
              The exchange stays fixed for this permission.
            </p>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save permission</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
