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
import ToggleField from "@/components/ui/toggle-field"
import VhostSelect from "@/components/ui/vhost-select"
import type { ExchangeType } from "@/data/types"
import { useCluster } from "@/store/cluster"

export default function AddExchangeDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const [name, setName] = useState("")
  const [vhost, setVhost] = useState("/")
  const [type, setType] = useState<ExchangeType>("topic")
  const [durable, setDurable] = useState(true)
  const [autoDelete, setAutoDelete] = useState(false)
  const [internal, setInternal] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter an exchange name.")
    if (
      data.exchanges.some(
        (exchange) => exchange.name === clean && exchange.vhost === vhost
      )
    ) {
      return setError(`An exchange named ${clean} already exists on ${vhost}.`)
    }
    try {
      await actions.addExchange({
        name: clean,
        vhost,
        type,
        durable,
        autoDelete,
        internal,
        args: {},
      })
      toast.success("Exchange created", {
        description: `${clean} (${type}) on ${vhost}.`,
      })
      setName("")
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add exchange</DialogTitle>
            <DialogDescription>
              Create a routing exchange for your topology.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Exchange name" htmlFor="exchange-name">
              <Input
                id="exchange-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder="orders.retry"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Type">
                <Select
                  value={type}
                  onValueChange={(next) =>
                    setType(String(next) as ExchangeType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="fanout">Fanout</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="headers">Headers</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                label="Durable"
                checked={durable}
                onCheckedChange={setDurable}
              />
              <ToggleField
                label="Auto-delete"
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
              />
            </div>
            <ToggleField
              label="Internal"
              checked={internal}
              onCheckedChange={setInternal}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Declare exchange</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
