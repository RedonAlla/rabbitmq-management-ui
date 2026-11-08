import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { RegionError } from "@/components/region-states";
import { FactPanel, SectionFrame } from "@/components/detail";
import { useCluster } from "@/store/cluster";
import { fmtAgo, fmtDate } from "@/lib/format";
import NodesTable from "./cluster/NodesTable";
import ListenersTable from "./cluster/ListenersTable";

export function ClusterView() {
  const { data, status, error, actions } = useCluster();
  const [name, setName] = useState(data.cluster.name);
  const [nameError, setNameError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setNameError("Enter a cluster name.");
    if (clean === data.cluster.name) return setNameError("Enter a different name to save.");
    actions.renameCluster(clean);
    setName(clean);
    setNameError("");
    toast.success("Cluster renamed", { description: `Clients now see ${clean} in server properties.` });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Cluster"
        eyebrow={
          <>
            <Badge variant="success-light">Online</Badge>
            <span className="text-xs text-muted-foreground">
              RabbitMQ {data.cluster.version} · Erlang {data.cluster.erlang}
            </span>
          </>
        }
        description="Cluster identity, member resources and the listeners clients connect to."
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <SectionFrame
          title="Cluster name"
          description="Announced to clients in the AMQP server properties before authentication. It is not a secret."
        >
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cluster-name">Name</Label>
              <Input
                id="cluster-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError("");
                }}
                maxLength={255}
                placeholder="qoder-rabbit"
              />
            </div>
            {nameError ? (
              <p className="text-xs text-destructive-foreground" role="alert">
                {nameError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Shovel and federation use this name to identify which clusters a message traversed.
              </p>
            )}
            <div>
              <Button type="submit">Change name</Button>
            </div>
          </form>
        </SectionFrame>

        <FactPanel
          title="Cluster identity"
          description="Reported by the management API."
          facts={[
            { label: "Cluster", value: data.cluster.name, mono: true },
            { label: "Version", value: data.cluster.version },
            { label: "Erlang", value: data.cluster.erlang },
            { label: "First node", value: data.cluster.node, mono: true },
            {
              label: "Started",
              value: `${fmtDate(data.cluster.startedAt)} · ${fmtAgo(data.cluster.startedAt, new Date().getTime())}`,
            },
            { label: "Members", value: `${data.nodes.length} nodes` },
            { label: "Listeners", value: `${data.ports.length} ports` },
          ]}
        />
      </div>

      <NodesTable nodes={data.nodes} loading={status === "loading"} error={error} onRetry={actions.retry} />
      <ListenersTable ports={data.ports} loading={status === "loading"} error={error} onRetry={actions.retry} />
    </div>
  );
}
