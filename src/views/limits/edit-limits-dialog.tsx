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
    String(current?.maxConnections ?? 1024)
  )
  const [queues, setQueues] = useState(String(current?.maxQueues ?? 2048))
  const [error, setError] = useState("")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const maxConnections = Number(connections)
    const maxQueues = Number(queues)
    if (!Number.isFinite(maxConnections) || maxConnections < 1) {
      return setError("Max connections must be a positive number.")
    }
    if (!Number.isFinite(maxQueues) || maxQueues < 1) {
      return setError("Max queues must be a positive number.")
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
                  setConnections(String(limit?.maxConnections ?? 1024))
                  setQueues(String(limit?.maxQueues ?? 2048))
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max connections" htmlFor="limit-connections">
                <Input
                  id="limit-connections"
                  value={connections}
                  onChange={(event) => setConnections(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Max queues" htmlFor="limit-queues">
                <Input
                  id="limit-queues"
                  value={queues}
                  onChange={(event) => setQueues(event.target.value)}
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
