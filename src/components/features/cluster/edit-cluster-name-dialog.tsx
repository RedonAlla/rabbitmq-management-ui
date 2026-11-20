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
import { useCluster } from "@/store/cluster"

export default function EditClusterNameDialog({
  open,
  initialName,
  onClose,
}: {
  open: boolean
  initialName: string
  onClose: () => void
}) {
  const { actions } = useCluster()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = name.trim()
    if (!next) return setError("Enter a cluster name.")
    if (next === initialName) {
      return setError("The new name matches the current one.")
    }

    try {
      await actions.renameCluster(next)
      toast.success("Cluster renamed", {
        description: `Clients now identify this cluster as ${next}.`,
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
            <DialogTitle>Change cluster name</DialogTitle>
            <DialogDescription>
              Identifies this cluster over AMQP connections and to the shovel and
              federation plugins.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field
              label="Cluster name"
              htmlFor="cluster-name"
              info="Announced in the AMQP server properties before authentication, so it must not be considered secret."
            >
              <Input
                id="cluster-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                placeholder="rabbit@node"
                spellCheck={false}
                autoFocus
              />
            </Field>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save name</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
