import { useState } from "react";
import {
  ArrowRightIcon,
  GitBranchIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SectionFrame } from "@/components/detail";
import { RegionEmpty } from "@/components/region-states";
import { bindingSummary } from "@/lib/format";
import { routeHref } from "@/lib/router";
import { useCluster } from "@/store/cluster";
import type { Binding } from "@/data/types";

type Props = {
  bindings: Binding[];
  onAddBinding: () => void;
};

export default function QueueBindingsFrame({ bindings, onAddBinding }: Props) {
  const { actions } = useCluster();
  const [target, setTarget] = useState<Binding | null>(null);

  const remove = async (binding: Binding) => {
    try {
      await actions.deleteBinding({
        vhost: binding.vhost,
        source: binding.source,
        destination: binding.destination,
        destType: binding.destType,
        propertiesKey: binding.propertiesKey,
      });
      toast.success("Binding removed", {
        description: `${binding.source} → ${binding.destination}${
          binding.routingKey ? ` (${binding.routingKey})` : ""
        }.`,
      });
    } catch (cause) {
      toast.error("Binding was not removed", {
        description:
          cause instanceof Error
            ? cause.message
            : "The management API did not respond.",
      });
    }
  };

  return (
    <>
      <SectionFrame
        title="Bindings"
        description={`${bindings.length} ${bindings.length === 1 ? "binding delivers" : "bindings deliver"} to this queue.`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddBinding}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add binding
          </Button>
        }
      >
        {bindings.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {bindings.map((binding) => (
              <li
                key={
                  binding.propertiesKey ||
                  `${binding.source}-${binding.routingKey}`
                }
                className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                    {binding.source ? (
                      <a
                        href={routeHref("exchange", binding.source)}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {binding.source}
                      </a>
                    ) : (
                      <span className="font-medium">(default exchange)</span>
                    )}
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="size-3.5 text-muted-foreground"
                    />
                    <span className="data-cell">
                      {binding.routingKey || "(empty)"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {bindingSummary(binding.args) || "No binding arguments"}
                  </span>
                </div>
                {binding.source ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove binding from ${binding.source}${
                      binding.routingKey
                        ? ` with routing key ${binding.routingKey}`
                        : ""
                    }`}
                    onClick={() => setTarget(binding)}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <RegionEmpty
            title="No bindings"
            description="Bind this queue to an exchange so its messages can reach it."
            icon={<GitBranchIcon />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddBinding}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Add binding
              </Button>
            }
          />
        )}
      </SectionFrame>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(next) => (next ? undefined : setTarget(null))}
        title="Remove binding?"
        description={
          target
            ? `This removes the binding from ${target.source} to ${
                target.destination
              }${
                target.routingKey
                  ? ` with routing key ${target.routingKey}`
                  : ""
              }. Messages already in the queue stay.`
            : ""
        }
        confirmLabel="Remove binding"
        tone="destructive"
        onConfirm={() => {
          if (target) void remove(target);
          setTarget(null);
        }}
      />
    </>
  );
}
