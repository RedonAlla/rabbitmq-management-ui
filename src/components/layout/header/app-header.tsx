import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SearchAction } from "./search-action";
import { RefreshActions } from "./refresh-actions";
import { ToggleTheme } from "./toggle-theme";
import { UserActions } from "./user-actions";
import type { SetStateAction } from "react";
import type { RefreshInterval } from "@/store/cluster";
import { HelpActions } from "./help-actions";

const TITLES: Record<string, string> = {
  overview: "Overview",
  queues: "Queues",
  queue: "Queue",
  exchanges: "Exchanges",
  exchange: "Exchange",
  connections: "Connections",
  connection: "Connection",
  channels: "Channels",
  channel: "Channel",
  users: "Users",
  vhosts: "Virtual hosts",
  policies: "Policies",
  limits: "Limits",
  flags: "Feature flags",
  deprecated: "Deprecated features",
  cluster: "Cluster",
  definitions: "Import / export definitions",
}

type Props = {
  clusterName: string;
  route: string;
  refreshInterval: RefreshInterval;
  refresh: () => void;
  setRefreshInterval: (value: RefreshInterval) => void;
  setPaletteOpen: (value: SetStateAction<boolean>) => void;
}

export function AppHeader({
  route,
  clusterName,
  refreshInterval,
  refresh,
  setPaletteOpen,
  setRefreshInterval
}: Props) {
  const pageTitle = TITLES[route] ?? "Not found"

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="my-auto h-4" />
      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate text-xs text-muted-foreground">
          {clusterName} / {pageTitle}
        </span>
        <span className="truncate text-sm font-medium">{pageTitle}</span>
      </div>

      <SearchAction setPaletteOpen={setPaletteOpen} />

      <div className="flex items-center gap-1.5">
        <RefreshActions
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval
        }
        />
        <ToggleTheme />
        <HelpActions refresh={refresh} />
        <UserActions />
      </div>
    </header>
  )
}
