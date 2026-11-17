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
import { Textarea } from "@/components/ui/textarea"
import VhostSelect from "@/components/ui/vhost-select"
import { useCluster } from "@/store/cluster"

export default function AddPolicyDialog({
  open,
  onClose,
  operator = false,
}: {
  open: boolean
  onClose: () => void
  operator?: boolean
}) {
  const { data, actions } = useCluster()
  const existing = operator ? data.operatorPolicies : data.policies
  const [name, setName] = useState("")
  const [vhost, setVhost] = useState("/")
  const [pattern, setPattern] = useState("^orders\\.")
  const [applyTo, setApplyTo] = useState<"queues" | "exchanges" | "all">(
    "queues"
  )
  const [priority, setPriority] = useState(operator ? "10" : "1")
  const [definition, setDefinition] = useState("max-length=50000")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter a policy name.")
    if (
      existing.some((policy) => policy.name === clean && policy.vhost === vhost)
    ) {
      return setError(`A policy named ${clean} already exists on ${vhost}.`)
    }
    const parsed: Record<string, string | number> = {}
    for (const line of definition.split("\n")) {
      const [rawKey, ...rest] = line.split("=")
      const key = rawKey?.trim()
      const value = rest.join("=").trim()
      if (!key) continue
      if (!value) return setError(`Policy ${key} needs a value.`)
      parsed[key] =
        Number.isFinite(Number(value)) && value !== "" ? Number(value) : value
    }
    if (!Object.keys(parsed).length)
      return setError("Add at least one definition.")
    const policy = {
      name: clean,
      vhost,
      pattern: pattern.trim() || ".*",
      applyTo,
      priority: Number(priority) || 0,
      definition: parsed,
    }
    try {
      await actions.addPolicy(policy, operator)
      toast.success(operator ? "Operator policy created" : "Policy created", {
        description: `${clean} applies to ${applyTo} on ${vhost}.`,
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
            <DialogTitle>
              {operator ? "Add operator policy" : "Add policy"}
            </DialogTitle>
            <DialogDescription>
              {operator
                ? "Override user policies for matching queues and exchanges."
                : "Apply limits and behaviour by name pattern."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Policy name" htmlFor="policy-name">
                <Input
                  id="policy-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError("")
                  }}
                  placeholder={operator ? "operator-max-length" : "orders-dlx"}
                  autoFocus
                />
              </Field>
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pattern" htmlFor="policy-pattern">
                <Input
                  id="policy-pattern"
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Apply to">
                <Select
                  value={applyTo}
                  onValueChange={(next) =>
                    setApplyTo(String(next) as typeof applyTo)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queues">Queues</SelectItem>
                    <SelectItem value="exchanges">Exchanges</SelectItem>
                    <SelectItem value="all">Queues and exchanges</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <Field label="Priority" htmlFor="policy-priority">
                <Input
                  id="policy-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Definition"
                htmlFor="policy-definition"
                info="One key=value per line, for example message-ttl=86400000. Values that parse as numbers are sent as numbers."
              >
                <Textarea
                  id="policy-definition"
                  value={definition}
                  onChange={(event) => setDefinition(event.target.value)}
                  className="min-h-20 font-mono text-xs"
                />
              </Field>
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">
              {operator ? "Create operator policy" : "Create policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
