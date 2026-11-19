import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Field from "@/components/ui/field"
import FormError from "@/components/ui/form-error"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCluster } from "@/store/cluster"
import type { CreateVhostInput } from "@/lib/rabbit-api"

const QUEUE_TYPE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "classic", label: "Classic" },
  { value: "quorum", label: "Quorum" },
  { value: "stream", label: "Stream" },
] as const

export function AddVhostDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [queueType, setQueueType] = useState<string>("default")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError("Enter a virtual host name.")
    if (data.vhosts.some((vhost) => vhost.name === clean)) {
      return setError(`${clean} already exists.`)
    }
    try {
      await actions.addVhost({
        name: clean,
        description: description.trim() || "Custom virtual host",
        tags: tags.trim(),
        defaultQueueType:
          queueType === "default"
            ? ""
            : (queueType as CreateVhostInput["defaultQueueType"]),
      })
      toast.success("Virtual host created", {
        description: `${clean} is ready for topology.`,
      })
      setName("")
      setDescription("")
      setTags("")
      setQueueType("default")
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
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[40vw] sm:max-w-xl"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="gap-2">
            <SheetTitle>Add virtual host</SheetTitle>
            <SheetDescription>
              Isolate queues, exchanges and permissions.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 pb-4">
            <Field label="Name" htmlFor="vhost-name">
              <Input
                id="vhost-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder="production-eu"
                autoFocus
              />
            </Field>
            <Field label="Description" htmlFor="vhost-description">
              <Textarea
                id="vhost-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="EU production workloads"
              />
            </Field>
            <Field label="Tags" htmlFor="vhost-tags">
              <Input
                id="vhost-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="monitoring, production"
              />
            </Field>
            <Field label="Default queue type">
              <Select
                value={queueType}
                onValueChange={(next) => setQueueType(String(next))}
                items={QUEUE_TYPE_OPTIONS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUEUE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
            <Button type="submit">Create virtual host</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
