import { ArrowRightIcon, GitBranchIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionFrame } from "@/components/detail";
import { RegionEmpty } from "@/components/region-states";
import { definitionSummary } from "@/lib/format";
import { routeHref } from "@/lib/router";
import type { Binding } from "@/data/types";

type Props = {
  bindings: Binding[];
  onAddBinding: () => void;
};

export default function QueueBindingsFrame({ bindings, onAddBinding }: Props) {
  return (
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
              key={`${binding.source}-${binding.routingKey}`}
              className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0"
            >
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
                {definitionSummary(binding.args) || "No binding arguments"}
              </span>
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
  );
}
