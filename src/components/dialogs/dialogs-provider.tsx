import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCluster } from "@/store/cluster";
import { routeTargets } from "@/lib/topology";
import { fmtInt } from "@/lib/format";
import type { ExchangeType, QueueType, User } from "@/data/types";
import { cn } from "@/lib/utils";

export type DialogRequest =
  | { type: "add-queue" }
  | { type: "add-exchange" }
  | { type: "add-user" }
  | { type: "add-vhost" }
  | { type: "add-policy" }
  | { type: "add-operator-policy" }
  | { type: "edit-limits"; vhost?: string }
  | { type: "publish"; exchange?: string; vhost?: string }
  | { type: "shortcuts" };

interface DialogsContextValue {
  dialog: DialogRequest | null;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
}

const DialogsContext = createContext<DialogsContextValue | null>(null);

const DEFAULT_EXCHANGE = "__default__";

function nowMs() {
  return new Date().getTime();
}

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

function ToggleField({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-xs text-destructive-foreground" role="alert">
      {children}
    </p>
  );
}

function VhostSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { data } = useCluster();
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data.vhosts.map((vhost) => (
          <SelectItem key={vhost.name} value={vhost.name}>
            {vhost.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DialogBody({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4">{children}</div>;
}

function AddQueueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [type, setType] = useState<QueueType>("classic");
  const [durable, setDurable] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [maxLength, setMaxLength] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setVhost("/");
    setType("classic");
    setDurable(true);
    setAutoDelete(false);
    setMaxLength("");
    setError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a queue name.");
    if (data.queues.some((queue) => queue.name === clean && queue.vhost === vhost)) {
      return setError(`A queue named ${clean} already exists on ${vhost}.`);
    }
    const args: Record<string, string | number> = { "x-queue-type": type };
    if (maxLength.trim() && Number.isFinite(Number(maxLength))) {
      args["x-max-length"] = Number(maxLength);
    }
    actions.addQueue({
      name: clean,
      vhost,
      type,
      durable,
      autoDelete,
      exclusive: false,
      state: "idle",
      ready: 0,
      unacked: 0,
      consumers: 0,
      publishRate: 0,
      deliverRate: 0,
      ackRate: 0,
      redelivered: 0,
      memory: 0.1,
      policy: null,
      args,
      created: nowMs(),
    });
    toast.success("Queue created", { description: `${clean} declared on ${vhost}.` });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add queue</DialogTitle>
            <DialogDescription>Declare a durable queue on an existing virtual host.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Queue name" htmlFor="queue-name">
              <Input
                id="queue-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="orders.created"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect value={vhost} onChange={setVhost} />
              </Field>
              <Field label="Queue type">
                <Select value={type} onValueChange={(next) => setType(String(next) as QueueType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="quorum">Quorum</SelectItem>
                    <SelectItem value="stream">Stream</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label="Max length (optional)"
              htmlFor="queue-max-length"
              hint="Omit to keep the queue unbounded."
            >
              <Input
                id="queue-max-length"
                value={maxLength}
                onChange={(event) => setMaxLength(event.target.value)}
                inputMode="numeric"
                placeholder="50000"
              />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                label="Durable"
                hint="Survives a broker restart"
                checked={durable}
                onCheckedChange={setDurable}
              />
              <ToggleField
                label="Auto-delete"
                hint="Removed with its last consumer"
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
              />
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Declare queue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddExchangeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [type, setType] = useState<ExchangeType>("topic");
  const [durable, setDurable] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter an exchange name.");
    if (data.exchanges.some((exchange) => exchange.name === clean && exchange.vhost === vhost)) {
      return setError(`An exchange named ${clean} already exists on ${vhost}.`);
    }
    actions.addExchange({
      name: clean,
      vhost,
      type,
      durable,
      autoDelete,
      internal,
      publishRate: 0,
      deliverRate: 0,
      args: {},
    });
    toast.success("Exchange created", { description: `${clean} (${type}) on ${vhost}.` });
    setName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add exchange</DialogTitle>
            <DialogDescription>Create a routing exchange for your topology.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Exchange name" htmlFor="exchange-name">
              <Input
                id="exchange-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
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
                  onValueChange={(next) => setType(String(next) as ExchangeType)}
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
                hint="Survives a broker restart"
                checked={durable}
                onCheckedChange={setDurable}
              />
              <ToggleField
                label="Auto-delete"
                hint="Removed when unused"
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
              />
            </div>
            <ToggleField
              label="Internal"
              hint="Only reachable from other exchanges"
              checked={internal}
              onCheckedChange={setInternal}
            />
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Declare exchange</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useCluster();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tags, setTags] = useState<string[]>(["management"]);
  const [vhosts, setVhosts] = useState<string[]>(["/"]);
  const [error, setError] = useState("");

  const toggle = (list: string[], setList: (next: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = username.trim();
    if (!clean) return setError("Enter a username.");
    if (data.users.some((user) => user.username === clean)) {
      return setError(`${clean} already exists.`);
    }
    if (password.trim().length < 4) return setError("Use a password of at least 4 characters.");
    const user: User = {
      username: clean,
      tags: tags.length ? tags : ["management"],
      vhosts: vhosts.length ? vhosts : ["/"],
      hash: "rabbit_password_hashing_sha256",
    };
    actions.addUser(user);
    toast.success("User created", { description: `${clean} can access ${user.vhosts.join(", ")}.` });
    setUsername("");
    setPassword("");
    setTags(["management"]);
    setVhosts(["/"]);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Grant a client access to specific virtual hosts.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <Field label="Tags">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {["administrator", "management", "policymaker", "monitoring"].map((tag) => (
                  <Label key={tag} className="font-normal text-muted-foreground">
                    <Checkbox
                      checked={tags.includes(tag)}
                      onCheckedChange={() => toggle(tags, setTags, tag)}
                    />
                    {tag}
                  </Label>
                ))}
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
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Create user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddVhostDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              hint="Copy published messages to the trace exchange"
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

function PolicyDialog({
  open,
  onClose,
  operator = false,
}: {
  open: boolean;
  onClose: () => void;
  operator?: boolean;
}) {
  const { data, actions } = useCluster();
  const existing = operator ? data.operatorPolicies : data.policies;
  const [name, setName] = useState("");
  const [vhost, setVhost] = useState("/");
  const [pattern, setPattern] = useState("^orders\\.");
  const [applyTo, setApplyTo] = useState<"queues" | "exchanges" | "all">("queues");
  const [priority, setPriority] = useState(operator ? "10" : "1");
  const [definition, setDefinition] = useState("max-length=50000");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Enter a policy name.");
    if (existing.some((policy) => policy.name === clean && policy.vhost === vhost)) {
      return setError(`A policy named ${clean} already exists on ${vhost}.`);
    }
    const parsed: Record<string, string | number> = {};
    for (const line of definition.split("\n")) {
      const [rawKey, ...rest] = line.split("=");
      const key = rawKey?.trim();
      const value = rest.join("=").trim();
      if (!key) continue;
      if (!value) return setError(`Policy ${key} needs a value.`);
      parsed[key] = Number.isFinite(Number(value)) && value !== "" ? Number(value) : value;
    }
    if (!Object.keys(parsed).length) return setError("Add at least one definition.");
    const policy = {
      name: clean,
      vhost,
      pattern: pattern.trim() || ".*",
      applyTo,
      priority: Number(priority) || 0,
      definition: parsed,
    };
    if (operator) {
      actions.addOperatorPolicy(policy);
    } else {
      actions.addPolicy(policy);
    }
    toast.success(operator ? "Operator policy created" : "Policy created", {
      description: `${clean} applies to ${applyTo} on ${vhost}.`,
    });
    setName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{operator ? "Add operator policy" : "Add policy"}</DialogTitle>
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
                    setName(event.target.value);
                    setError("");
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
              <Field label="Pattern" htmlFor="policy-pattern" hint="Regular expression on entity names.">
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
                  onValueChange={(next) => setApplyTo(String(next) as typeof applyTo)}
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
                hint="One key=value per line, e.g. message-ttl=86400000."
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
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">{operator ? "Create operator policy" : "Create policy"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PublishDialog({
  open,
  onClose,
  initialExchange,
  initialVhost,
}: {
  open: boolean;
  onClose: () => void;
  initialExchange?: string;
  initialVhost?: string;
}) {
  const { data, actions } = useCluster();
  const [vhost, setVhost] = useState(initialVhost ?? "/");
  const [exchange, setExchange] = useState(initialExchange ?? DEFAULT_EXCHANGE);
  const [routingKey, setRoutingKey] = useState("");
  const [count, setCount] = useState("1");
  const [payload, setPayload] = useState('{\n  "orderId": "ord_1042",\n  "status": "created"\n}');
  const [error, setError] = useState("");

  const resolvedName = exchange === DEFAULT_EXCHANGE ? "" : exchange;
  const exchangeRecord = data.exchanges.find(
    (entry) => entry.name === resolvedName && entry.vhost === vhost
  );
  const targets = exchangeRecord
    ? routeTargets(exchangeRecord, routingKey, data.bindings, data.queues)
    : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(count);
    if (!Number.isFinite(amount) || amount < 1) return setError("Publish at least one message.");
    actions.publish({
      exchange: resolvedName,
      vhost,
      routingKey: routingKey.trim(),
      targets,
      count: Math.floor(amount),
    });
    toast.success("Message published", {
      description:
        targets.length > 0
          ? `${fmtInt(amount)} to ${targets.join(", ")}`
          : "No bindings matched, the message was dropped.",
    });
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Publish message</DialogTitle>
            <DialogDescription>Send a simulated message through the selected exchange.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Virtual host">
                <VhostSelect
                  value={vhost}
                  onChange={(next) => {
                    setVhost(next);
                    setExchange(DEFAULT_EXCHANGE);
                  }}
                />
              </Field>
              <Field label="Exchange">
                <Select value={exchange} onValueChange={(next) => setExchange(String(next))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_EXCHANGE}>(default exchange)</SelectItem>
                    {data.exchanges
                      .filter((entry) => entry.vhost === vhost && entry.name !== "")
                      .map((entry) => (
                        <SelectItem key={entry.name} value={entry.name}>
                          {entry.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Field
                label="Routing key"
                htmlFor="publish-routing-key"
                hint={
                  targets.length
                    ? `Routes to ${targets.join(", ")}`
                    : "No queue currently matches this key."
                }
              >
                <Input
                  id="publish-routing-key"
                  value={routingKey}
                  onChange={(event) => setRoutingKey(event.target.value)}
                  placeholder="orders.created"
                  className="font-mono"
                  autoFocus
                />
              </Field>
              <Field label="Count" htmlFor="publish-count">
                <Input
                  id="publish-count"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
            </div>
            <Field label="Payload" htmlFor="publish-payload" hint="JSON body attached to each message.">
              <Textarea
                id="publish-payload"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                className="min-h-28 font-mono text-xs"
              />
            </Field>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Publish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LimitsDialog({
  open,
  onClose,
  initialVhost,
}: {
  open: boolean;
  onClose: () => void;
  initialVhost?: string;
}) {
  const { data, actions } = useCluster();
  const [vhost, setVhost] = useState(initialVhost ?? data.limits[0]?.vhost ?? "/");
  const current = data.limits.find((limit) => limit.vhost === vhost);
  const [connections, setConnections] = useState(String(current?.maxConnections ?? 1024));
  const [queues, setQueues] = useState(String(current?.maxQueues ?? 2048));
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const maxConnections = Number(connections);
    const maxQueues = Number(queues);
    if (!Number.isFinite(maxConnections) || maxConnections < 1) {
      return setError("Max connections must be a positive number.");
    }
    if (!Number.isFinite(maxQueues) || maxQueues < 1) {
      return setError("Max queues must be a positive number.");
    }
    actions.updateLimit({ vhost, maxConnections, maxQueues });
    toast.success("Limits updated", { description: `${vhost} limits were saved.` });
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit limits</DialogTitle>
            <DialogDescription>Cap connections and queues for a virtual host.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Virtual host">
              <Select
                value={vhost}
                onValueChange={(next) => {
                  const value = String(next);
                  setVhost(value);
                  const limit = data.limits.find((entry) => entry.vhost === value);
                  setConnections(String(limit?.maxConnections ?? 1024));
                  setQueues(String(limit?.maxQueues ?? 2048));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.vhosts.map((entry) => (
                    <SelectItem key={entry.name} value={entry.name}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Save limits</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SHORTCUTS = [
  ["⌘ K", "Open the command palette"],
  ["?", "Show keyboard shortcuts"],
  ["g o", "Go to overview"],
  ["g q", "Go to queues"],
  ["g e", "Go to exchanges"],
  ["g c", "Go to connections"],
  ["g u", "Go to users"],
  ["g v", "Go to virtual hosts"],
  ["g p", "Go to policies"],
  ["g l", "Go to limits"],
  ["g f", "Go to feature flags"],
  ["g d", "Go to deprecated features"],
  ["g k", "Go to cluster"],
  ["g i", "Go to import / export"],
  ["d", "Toggle dark mode"],
  ["⌘ B", "Collapse the sidebar"],
  ["Esc", "Close the current layer"],
];

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the management UI without a mouse.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd className="border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const closeDialog = () => setDialog(null);

  const value = useMemo<DialogsContextValue>(
    () => ({ dialog, openDialog: setDialog, closeDialog }),
    [dialog]
  );

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddQueueDialog open={dialog?.type === "add-queue"} onClose={closeDialog} />
      <AddExchangeDialog open={dialog?.type === "add-exchange"} onClose={closeDialog} />
      <AddUserDialog open={dialog?.type === "add-user"} onClose={closeDialog} />
      <AddVhostDialog open={dialog?.type === "add-vhost"} onClose={closeDialog} />
      <PolicyDialog open={dialog?.type === "add-policy"} onClose={closeDialog} />
      <PolicyDialog
        open={dialog?.type === "add-operator-policy"}
        onClose={closeDialog}
        operator
      />
      <PublishDialog
        open={dialog?.type === "publish"}
        onClose={closeDialog}
        initialExchange={dialog?.type === "publish" ? dialog.exchange : undefined}
        initialVhost={dialog?.type === "publish" ? dialog.vhost : undefined}
      />
      <LimitsDialog
        open={dialog?.type === "edit-limits"}
        onClose={closeDialog}
        initialVhost={dialog?.type === "edit-limits" ? dialog.vhost : undefined}
      />
      <ShortcutsDialog open={dialog?.type === "shortcuts"} onClose={closeDialog} />
    </DialogsContext.Provider>
  );
}

export function useDialogs(): DialogsContextValue {
  const context = useContext(DialogsContext);
  if (!context) throw new Error("useDialogs must be used inside DialogsProvider");
  return context;
}
