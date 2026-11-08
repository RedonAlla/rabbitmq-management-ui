import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { User } from "@/data/types";
import { cn } from "@/lib/utils";
import FormError from "@/components/ui/form-error";
import { useCluster } from "@/store/cluster";

function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const USER_TAGS = [
  {
    name: "administrator",
    description: "User can do everything monitoring can do, manage users, vhosts and permissions, close other user's connections, and manage policies and parameters for all vhosts.",
  },
  {
    name: "management",
    description: "Sign in to the management UI and view resources in assigned virtual hosts.",
  },
  {
    name: "policymaker",
    description: "User can access the management plugin and manage policies and parameters for the vhosts they have access to.",
  },
  {
    name: "monitoring",
    description: "User can access the management plugin and see all connections and channels as well as node-related information.",
  },
];

export default function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tag, setTag] = useState("management");
  const [vhosts, setVhosts] = useState<string[]>(["/"]);
  const [error, setError] = useState("");

  const toggle = (list: string[], setList: (next: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = username.trim();

    if (!clean)
      return setError("Enter a username.");

    if (data.users.some((user) => user.username === clean)) 
      return setError(`${clean} already exists.`);
    
    if (password.trim().length < 4)
      return setError("Use a password of at least 4 characters.");

    const user: User = {
      username: clean,
      tags: [tag],
      vhosts: vhosts.length ? vhosts : ["/"],
      hash: "rabbit_password_hashing_sha256",
    };

    actions.addUser(user);

    toast.success("User created", { description: `${clean} can access ${user.vhosts.join(", ")}.` });
    
    setUsername("");
    setPassword("");
    setTag("management");
    setVhosts(["/"]);
    setError("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>Add user</SheetTitle>
            <SheetDescription>Grant a client access to specific virtual hosts.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <Field label="Username" htmlFor="user-name">
              <Input
                id="user-name"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                placeholder="reporting"
                autoFocus
              />
            </Field>
            <Field label="Password" htmlFor="user-password">
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Tags" hint="Choose one tag for the user.">
              <div className="flex flex-col gap-2">
                {USER_TAGS.map((option) => {
                  const selected = tag === option.name;
                  return (
                    <label
                      key={option.name}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-2.5 py-1 transition-colors",
                        selected ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50",
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => setTag(option.name)}
                        className="mt-0.5"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">{option.name}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Virtual hosts">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {data.vhosts.map((vhost) => (
                  <Label key={vhost.name} className="font-normal text-muted-foreground">
                    <Checkbox
                      checked={vhosts.includes(vhost.name)}
                      onCheckedChange={() => toggle(vhosts, setVhosts, vhost.name)}
                    />
                    {vhost.name}
                  </Label>
                ))}
              </div>
            </Field>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
            <Button type="submit">Create user</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}