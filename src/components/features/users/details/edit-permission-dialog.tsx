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
import type { UserPermission } from "@/lib/rabbit-api"

export function EditUserPermissionDialog({
  open,
  username,
  permission,
  onClose,
  onSaved,
}: {
  open: boolean
  username: string
  permission: UserPermission | null
  onClose: () => void
  onSaved?: () => void
}) {
  const { actions } = useCluster()
  const [configure, setConfigure] = useState(permission?.configure ?? "")
  const [write, setWrite] = useState(permission?.write ?? "")
  const [read, setRead] = useState(permission?.read ?? "")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!permission) return

    try {
      await actions.updateUserPermission({
        username,
        vhost: permission.vhost,
        configure,
        write,
        read,
      })

      toast.success("Permissions updated", {
        description: `${username} on ${permission.vhost}.`,
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
            <DialogTitle>Edit permissions</DialogTitle>
            <DialogDescription>
              Configure, write and read patterns for {username} on{" "}
              {permission?.vhost ?? "the virtual host"}.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Configure" htmlFor="permission-configure">
              <Input
                id="permission-configure"
                className="data-cell"
                value={configure}
                onChange={(event) => {
                  setConfigure(event.target.value)
                  setError("")
                }}
                placeholder=".*"
                autoFocus
              />
            </Field>
            <Field label="Write" htmlFor="permission-write">
              <Input
                id="permission-write"
                className="data-cell"
                value={write}
                onChange={(event) => {
                  setWrite(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Read" htmlFor="permission-read">
              <Input
                id="permission-read"
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
              Patterns are regular expressions. Leaving a pattern empty denies
              that operation on this virtual host.
            </p>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save permissions</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
