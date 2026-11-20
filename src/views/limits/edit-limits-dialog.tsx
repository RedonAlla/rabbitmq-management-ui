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
import VhostSelect from "@/components/ui/vhost-select"
import { useCluster } from "@/store/cluster"

function parseLimit(raw: string): number | null | "invalid" {
  if (!raw.trim()) return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) return "invalid"
  return value
}

export default function EditLimitsDialog({
  open,
  onClose,
  initialVhost,
}: {
  open: boolean
  onClose: () => void
  initialVhost?: string
}) {
  const { data, actions } = useCluster()
  const [vhost, setVhost] = useState(
    initialVhost ?? data.limits[0]?.vhost ?? "/"
  )
  const current = data.limits.find((limit) => limit.vhost === vhost)
  const [connections, setConnections] = useState(
    String(current?.maxConnections ?? "")
  )
  const [queues, setQueues] = useState(String(current?.maxQueues ?? ""))
  const [error, setError] = useState("")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const maxConnections = parseLimit(connections)
    const maxQueues = parseLimit(queues)
    if (maxConnections === "invalid") {
      return setError("Max connections must be a non-negative integer.")
    }
    if (maxQueues === "invalid") {
      return setError("Max queues must be a non-negative integer.")
    }
    if (maxConnections === null && maxQueues === null) {
      return setError("Set at least one limit.")
    }
    actions.updateLimit({ vhost, maxConnections, maxQueues })
    toast.success("Limits updated", {
      description: `${vhost} limits were saved.`,
    })
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit limits</DialogTitle>
            <DialogDescription>
              Cap connections and queues for a virtual host.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Virtual host">
              <VhostSelect
                value={vhost}
                onChange={(value) => {
                  setVhost(value)
                  const limit = data.limits.find(
                    (entry) => entry.vhost === value
                  )
                  setConnections(String(limit?.maxConnections ?? ""))
                  setQueues(String(limit?.maxQueues ?? ""))
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Max connections"
                htmlFor="limit-connections"
                info="Concurrent client connections this virtual host allows. Leave empty to remove the limit; 0 blocks new connections."
              >
                <Input
                  id="limit-connections"
                  value={connections}
                  onChange={(event) => setConnections(event.target.value)}
                  placeholder="No limit"
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Max queues"
                htmlFor="limit-queues"
                info="Queues this virtual host can declare. Leave empty to remove the limit; 0 blocks new queues."
              >
                <Input
                  id="limit-queues"
                  value={queues}
                  onChange={(event) => setQueues(event.target.value)}
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
