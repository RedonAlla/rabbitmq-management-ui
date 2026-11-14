import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DialogBody from "@/components/ui/dialog-body";
import Field from "@/components/ui/field";
import FormError from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import ToggleField from "@/components/ui/toggle-field";
import { useCluster } from "@/store/cluster";

export default function AddVhostDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tracing, setTracing] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a virtual host name.");
    if (data.vhosts.some((vhost) => vhost.name === clean)) {
      return setError(`${clean} already exists.`);
    }
    actions.addVhost({
      name: clean,
      description: description.trim() || "Custom virtual host",
      tracing,
    });
    toast.success("Virtual host created", { description: `${clean} is ready for topology.` });
    setName("");
    setDescription("");
    setTracing(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add virtual host</DialogTitle>
            <DialogDescription>Isolate queues, exchanges and permissions.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Name" htmlFor="vhost-name">
              <Input
                id="vhost-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="production-eu"
                autoFocus
              />
            </Field>
            <Field label="Description" htmlFor="vhost-description">
              <Input
                id="vhost-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="EU production workloads"
              />
            </Field>
            <ToggleField
              label="Tracing"
              checked={tracing}
              onCheckedChange={setTracing}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Create virtual host</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
