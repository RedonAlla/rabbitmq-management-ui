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
import VhostSelect from "@/components/ui/vhost-select"
import { useCluster } from "@/store/cluster"
import type { UserTopicPermission } from "@/lib/rabbit-api"

export function AddUserTopicPermissionDialog({
  open,
  username,
  existing,
  onClose,
}: {
  open: boolean
  username: string
  existing: UserTopicPermission[]
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const topicExchanges = data.exchanges.filter(
    (exchange) => exchange.type === "topic" && !exchange.internal
  )
  const availableFor = (vhostName: string) =>
    topicExchanges
      .filter(
        (exchange) =>
          exchange.vhost === vhostName &&
          !existing.some(
            (permission) =>
              permission.vhost === exchange.vhost &&
              permission.exchange === exchange.name
          )
      )
      .map((exchange) => exchange.name)
  const availableVhosts = data.vhosts
    .filter((vhost) => availableFor(vhost.name).length > 0)
    .map((vhost) => vhost.name)
  const firstVhost = availableVhosts[0] ?? ""
  const [vhost, setVhost] = useState(firstVhost)
  const [exchange, setExchange] = useState(
    () => availableFor(firstVhost)[0] ?? ""
  )
  const [write, setWrite] = useState(".*")
  const [read, setRead] = useState(".*")
  const [error, setError] = useState("")
  const exchangeOptions = availableFor(vhost)

  useEffect(() => {
    if (!open) return
    const nextVhost = availableVhosts[0] ?? ""
    setVhost(nextVhost)
    setExchange(availableFor(nextVhost)[0] ?? "")
    setWrite(".*")
    setRead(".*")
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstVhost])

  const changeVhost = (next: string) => {
    setVhost(next)
    setExchange(availableFor(next)[0] ?? "")
    setError("")
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!vhost) return setError("Choose a virtual host with a topic exchange.")
    if (!exchange) return setError("Choose a topic exchange.")
    if (
      existing.some(
        (permission) =>
          permission.vhost === vhost && permission.exchange === exchange
      )
    ) {
      return setError(`${username} already has topic access to ${exchange}.`)
    }

    try {
      await actions.updateUserTopicPermission({
        username,
        vhost,
        exchange,
        write,
        read,
      })

      toast.success("Topic permission added", {
        description: `${username} can now use ${exchange} on ${vhost}.`,
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
            <DialogTitle>Add topic permission</DialogTitle>
            <DialogDescription>
              Grant {username} write and read access on one topic exchange.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Virtual host">
              <VhostSelect
                value={vhost}
                onChange={changeVhost}
                exclude={data.vhosts
                  .filter((entry) => availableFor(entry.name).length === 0)
                  .map((entry) => entry.name)}
              />
            </Field>
            <Field label="Topic exchange" htmlFor="topic-permission-exchange">
              {exchangeOptions.length > 0 ? (
                <Select
                  value={exchange}
                  onValueChange={(next) => {
                    setExchange(String(next))
                    setError("")
                  }}
                >
                  <SelectTrigger id="topic-permission-exchange" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exchangeOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {vhost
                    ? "Every topic exchange on this virtual host is already allowed."
                    : "No topic exchange is available to grant."}
                </p>
              )}
            </Field>
            <Field label="Write" htmlFor="topic-permission-write">
              <Input
                id="topic-permission-write"
                className="data-cell"
                value={write}
                onChange={(event) => {
                  setWrite(event.target.value)
                  setError("")
                }}
                placeholder=".*"
              />
            </Field>
            <Field label="Read" htmlFor="topic-permission-read">
              <Input
                id="topic-permission-read"
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
              Write covers publishing, read covers consuming and binding.
              Patterns are regular expressions matched against routing keys.
            </p>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!vhost || !exchange}>
              Add topic permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
