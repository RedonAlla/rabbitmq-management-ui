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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCluster } from "@/store/cluster"

export function GrantVhostPermissionDialog({
  open,
  vhost,
  grantedUsers,
  onClose,
  onSaved,
}: {
  open: boolean
  vhost: string
  grantedUsers: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { data, actions } = useCluster()
  const available = data.users.filter(
    (user) => !grantedUsers.includes(user.username)
  )
  const firstAvailable = available[0]?.username ?? ""
  const [username, setUsername] = useState(firstAvailable)
  const [configure, setConfigure] = useState(".*")
  const [write, setWrite] = useState(".*")
  const [read, setRead] = useState(".*")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setUsername(firstAvailable)
    setConfigure(".*")
    setWrite(".*")
    setRead(".*")
    setError("")
  }, [open, firstAvailable])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!username) return setError("Choose a user.")

    try {
      await actions.updateUserPermission({
        username,
        vhost,
        configure,
        write,
        read,
      })

      toast.success("Permission granted", {
        description: `${username} can now access ${vhost}.`,
      })
      setError("")
      onSaved()
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
            <DialogTitle>Grant permission</DialogTitle>
            <DialogDescription>
              Grant a user configure, write and read access on {vhost}.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="User" htmlFor="grant-permission-user">
              <Select
                value={username}
                onValueChange={(next) => {
                  setUsername(String(next))
                  setError("")
                }}
              >
                <SelectTrigger id="grant-permission-user" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {available.map((user) => (
                    <SelectItem key={user.username} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Configure" htmlFor="grant-permission-configure">
              <Input
                id="grant-permission-configure"
                className="data-cell"
                value={configure}
                onChange={(event) => {
                  setConfigure(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Write" htmlFor="grant-permission-write">
              <Input
                id="grant-permission-write"
                className="data-cell"
                value={write}
                onChange={(event) => {
                  setWrite(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Read" htmlFor="grant-permission-read">
              <Input
                id="grant-permission-read"
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
              Grant permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
