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
import JsonSection from "@/components/ui/json-section"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QueueArgumentValue } from "@/lib/rabbit-api"
import { useCluster } from "@/store/cluster"

function isArgumentValue(value: unknown): value is QueueArgumentValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true
  }
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
    )
  )
}

function parseArguments(text: string): {
  args: Record<string, QueueArgumentValue> | null
  error: string | null
} {
  if (!text.trim()) return { args: {}, error: null }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { args: null, error: "Arguments must be valid JSON." }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { args: null, error: "Arguments must be a JSON object." }
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (!isArgumentValue(value)) {
      return {
        args: null,
        error: `Argument ${key} must be a string, number, boolean, or a list of those.`,
      }
    }
  }
  return {
    args: parsed as Record<string, QueueArgumentValue>,
    error: null,
  }
}

export function AddBindingDialog({
  open,
  onClose,
  vhost,
  queue,
}: {
  open: boolean
  onClose: () => void
  vhost: string
  queue: string
}) {
  const { data, actions } = useCluster()
  const [source, setSource] = useState("")
  const [routingKey, setRoutingKey] = useState("")
  const [args, setArgs] = useState("")
  const [argsOpen, setArgsOpen] = useState(false)
  const [error, setError] = useState("")

  const exchanges = data.exchanges.filter(
    (entry) => entry.vhost === vhost && entry.name !== ""
  )
  const resolvedSource = exchanges.some((entry) => entry.name === source)
    ? source
    : (exchanges[0]?.name ?? "")

  useEffect(() => {
    if (!open) return
    setArgsOpen(false)
    setError("")
  }, [open])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!resolvedSource) {
      return setError("Choose the source exchange for this binding.")
    }
    const parsed = parseArguments(args)
    if (parsed.error) {
      setArgsOpen(true)
      return setError(parsed.error)
    }
    const key = routingKey.trim()
    try {
      await actions.addBinding({
        vhost,
        source: resolvedSource,
        destination: queue,
        routingKey: key,
        args: parsed.args ?? {},
      })
      toast.success("Binding created", {
        description: `${resolvedSource} → ${queue}${key ? ` (${key})` : ""}.`,
      })
      setRoutingKey("")
      setArgs("")
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
            <DialogTitle>Add binding</DialogTitle>
            <DialogDescription>
              Bind {queue} to an exchange so its routed messages reach this
              queue.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host" htmlFor="binding-vhost">
                <Input
                  id="binding-vhost"
                  value={vhost}
                  readOnly
                  className="font-mono"
                />
              </Field>
              <Field label="Destination queue" htmlFor="binding-destination">
                <Input
                  id="binding-destination"
                  value={queue}
                  readOnly
                  className="font-mono"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Source exchange"
                info="Bindings are declared from an exchange to this queue. The default exchange cannot be used as a binding source."
              >
                <Select
                  value={resolvedSource}
                  onValueChange={(next) => {
                    setSource(String(next))
                    setError("")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    {exchanges.map((entry) => (
                      <SelectItem key={entry.name} value={entry.name}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {exchanges.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    This virtual host has no exchanges to bind from.
                  </p>
                ) : null}
              </Field>
              <Field
                label="Routing key"
                htmlFor="binding-routing-key"
                info="The key the exchange matches against. Fanout exchanges ignore it; headers exchanges use the arguments instead."
              >
                <Input
                  id="binding-routing-key"
                  value={routingKey}
                  onChange={(event) => {
                    setRoutingKey(event.target.value)
                    setError("")
                  }}
                  placeholder="orders.created"
                  className="font-mono"
                />
              </Field>
            </div>
            <JsonSection
              label="Arguments"
              id="binding-arguments"
              info="Binding arguments may be a string, number, boolean, or a list of those. Headers exchanges read x-match and the header names; plugins read their own keys."
              placeholder={'{\n  "x-match": "all"\n}'}
              keyPlaceholder="x-match"
              valuePlaceholder="all"
              itemName="argument"
              valueTypes
              value={args}
              onChange={(next) => {
                setArgs(next)
                setError("")
              }}
              open={argsOpen}
              onOpenChange={(next) => {
                setArgsOpen(next)
                setError("")
              }}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Add binding</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
