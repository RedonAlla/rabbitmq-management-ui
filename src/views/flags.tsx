import { useMemo, useState } from "react";
import { FlagIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { RegionEmpty, RegionError, RegionSkeleton } from "@/components/region-states";
import { SectionFrame } from "@/components/detail";
import { StabilityBadge } from "@/components/badges";
import { useCluster } from "@/store/cluster";
import { matchesText } from "@/lib/filtering";

export function FlagsView() {
  const { data, status, error, actions } = useCluster();
  const [search, setSearch] = useState("");

  const flags = useMemo(
    () =>
      data.flags.filter(
        (flag) => matchesText(flag.name, search) || matchesText(flag.desc, search)
      ),
    [data.flags, search]
  );

  const stable = flags.filter((flag) => flag.stability === "stable");
  const experimental = flags.filter((flag) => flag.stability === "experimental");
  const enabled = data.flags.filter((flag) => flag.enabled).length;

  const toggle = (name: string, value: boolean) => {
    actions.toggleFlag(name);
    toast.success(value ? "Feature flag enabled" : "Feature flag disabled", {
      description: `${name} is now ${value ? "enabled" : "disabled"}.`,
    });
  };

  const renderFlags = (list: typeof flags) => (
    <div className="flex flex-col divide-y divide-border">
      {list.map((flag) => (
        <div key={flag.name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-mono truncate text-sm font-medium">{flag.name}</span>
              <StabilityBadge stability={flag.stability} />
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground">{flag.desc}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={flag.enabled ? "success-light" : "outline"}>
              {flag.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Switch
              checked={flag.enabled}
              onCheckedChange={(value) => toggle(flag.name, value)}
              aria-label={`Toggle ${flag.name}`}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Feature flags"
        description="Broker capabilities enabled on this cluster."
        actions={
          <Badge variant="outline">
            {enabled} of {data.flags.length} enabled
          </Badge>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search feature flags…" />

      {error ? (
        <RegionError message={error} onRetry={actions.retry} />
      ) : status === "loading" ? (
        <RegionSkeleton rows={6} />
      ) : flags.length === 0 ? (
        <RegionEmpty
          title="No feature flags match"
          description="Clear the search to see every capability."
          icon={<FlagIcon />}
        />
      ) : (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
          <SectionFrame
            title="Stable"
            description={`${stable.length} generally available capabilities.`}
          >
            {stable.length ? (
              renderFlags(stable)
            ) : (
              <p className="text-xs text-muted-foreground">No stable capabilities match.</p>
            )}
          </SectionFrame>
          <SectionFrame
            title="Experimental"
            description={`${experimental.length} capabilities that may change.`}
          >
            {experimental.length ? (
              renderFlags(experimental)
            ) : (
              <p className="text-xs text-muted-foreground">No experimental capabilities match.</p>
            )}
          </SectionFrame>
        </div>
      )}
    </div>
  );
}
