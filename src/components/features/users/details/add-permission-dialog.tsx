import { useEffect, useState, type FormEvent } from "react"
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
import VhostSelect from "@/components/ui/vhost-select"
import { useCluster } from "@/store/cluster"

export function AddUserPermissionDialog({
  open,
  username,
  existingVhosts,
  onClose,
}: {
  open: boolean
  username: string
  existingVhosts: string[]
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const available = data.vhosts.filter(
    (vhost) => !existingVhosts.includes(vhost.name)
  )
  const firstAvailable = available[0]?.name ?? ""
  const [vhost, setVhost] = useState(firstAvailable)
  const [configure, setConfigure] = useState(".*")
  const [write, setWrite] = useState(".*")
  const [read, setRead] = useState(".*")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setVhost(firstAvailable)
    setConfigure(".*")
    setWrite(".*")
    setRead(".*")
    setError("")
  }, [open, firstAvailable])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!vhost) return setError("Choose a virtual host.")

    try {
      await actions.updateUserPermission({
        username,
        vhost,
        configure,
        write,
        read,
      })

      toast.success("Permission added", {
        description: `${username} can now access ${vhost}.`,
      })
      setError("")
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
            <DialogTitle>Add permission</DialogTitle>
            <DialogDescription>
              Grant {username} configure, write and read access on another
              virtual host.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Virtual host">
              <VhostSelect
                value={vhost}
                onChange={(next) => {
                  setVhost(next)
                  setError("")
                }}
                exclude={existingVhosts}
              />
            </Field>
            <Field label="Configure" htmlFor="add-permission-configure">
              <Input
                id="add-permission-configure"
                className="data-cell"
                value={configure}
                onChange={(event) => {
                  setConfigure(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Write" htmlFor="add-permission-write">
              <Input
                id="add-permission-write"
                className="data-cell"
                value={write}
                onChange={(event) => {
                  setWrite(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Read" htmlFor="add-permission-read">
              <Input
                id="add-permission-read"
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
            <Button type="submit" disabled={!available.length}>
              Add permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
