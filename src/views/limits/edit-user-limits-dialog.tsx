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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCluster } from "@/store/cluster"

function parseLimit(raw: string): number | null | "invalid" {
  if (!raw.trim()) return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) return "invalid"
  return value
}

export default function EditUserLimitsDialog({
  open,
  onClose,
  initialUser,
}: {
  open: boolean
  onClose: () => void
  initialUser?: string
}) {
  const { data, actions } = useCluster()
  const [user, setUser] = useState(
    initialUser ?? data.userLimits[0]?.user ?? data.users[0]?.username ?? ""
  )
  const current = data.userLimits.find((limit) => limit.user === user)
  const [connections, setConnections] = useState(
    String(current?.maxConnections ?? "")
  )
  const [channels, setChannels] = useState(String(current?.maxChannels ?? ""))
  const [error, setError] = useState("")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const maxConnections = parseLimit(connections)
    const maxChannels = parseLimit(channels)
    if (!user) return setError("Select a user.")
    if (maxConnections === "invalid") {
      return setError("Max connections must be a non-negative integer.")
    }
    if (maxChannels === "invalid") {
      return setError("Max channels must be a non-negative integer.")
    }
    if (maxConnections === null && maxChannels === null) {
      return setError("Set at least one limit.")
    }
    if (
      maxConnections !== null &&
      maxChannels !== null &&
      maxChannels < maxConnections
    ) {
      return setError("Max channels must be at least the max connections.")
    }
    actions.updateUserLimit({ user, maxConnections, maxChannels })
    toast.success("Limits updated", {
      description: `${user} limits were saved.`,
    })
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit user limits</DialogTitle>
            <DialogDescription>
              Cap concurrent connections and channels for a user.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="User">
              <Select
                value={user}
                onValueChange={(value) => {
                  const next = String(value)
                  setUser(next)
                  const limit = data.userLimits.find(
                    (entry) => entry.user === next
                  )
                  setConnections(String(limit?.maxConnections ?? ""))
                  setChannels(String(limit?.maxChannels ?? ""))
                }}
              >
                <SelectTrigger aria-label="User" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.users.map((entry) => (
                    <SelectItem key={entry.username} value={entry.username}>
                      {entry.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Max connections"
                htmlFor="user-limit-connections"
                info="Concurrent connections this user can open across the cluster. Leave empty to remove the limit."
              >
                <Input
                  id="user-limit-connections"
                  value={connections}
                  onChange={(event) => setConnections(event.target.value)}
                  placeholder="No limit"
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Max channels"
                htmlFor="user-limit-channels"
                info="Total channels this user can open across all connections. Must be at least the connection limit. Leave empty to remove the limit."
              >
                <Input
                  id="user-limit-channels"
                  value={channels}
                  onChange={(event) => setChannels(event.target.value)}
                  placeholder="No limit"
                  inputMode="numeric"
                />
              </Field>
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save limits</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
