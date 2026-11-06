import { useMemo } from "react";
import {
  ActivityIcon,
  BoxesIcon,
  FileJsonIcon,
  FlagIcon,
  GaugeIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  PlugIcon,
  PlusIcon,
  SendIcon,
  ServerIcon,
  ShieldCheckIcon,
  SunMoonIcon,
  TriangleAlertIcon,
  UsersIcon,
  WaypointsIcon,
  ZapIcon,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useTheme } from "@/components/theme-provider";

const PAGES = [
  { view: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { view: "queues", label: "Queues", icon: ListOrderedIcon },
  { view: "exchanges", label: "Exchanges", icon: WaypointsIcon },
  { view: "connections", label: "Connections", icon: PlugIcon },
  { view: "channels", label: "Channels", icon: GitBranchIcon },
  { view: "users", label: "Users", icon: UsersIcon },
  { view: "vhosts", label: "Virtual hosts", icon: BoxesIcon },
  { view: "flags", label: "Feature flags", icon: FlagIcon },
  { view: "deprecated", label: "Deprecated features", icon: TriangleAlertIcon },
  { view: "policies", label: "Policies", icon: ShieldCheckIcon },
  { view: "limits", label: "Limits", icon: GaugeIcon },
  { view: "cluster", label: "Cluster", icon: ServerIcon },
  { view: "definitions", label: "Import / export definitions", icon: FileJsonIcon },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { data, live, actions } = useCluster();
  const { navigate } = useRoute();
  const { openDialog } = useDialogs();
  const { theme, setTheme } = useTheme();

  const run = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const queues = useMemo(
    () => [...data.queues].sort((a, b) => b.ready - a.ready).slice(0, 6),
    [data.queues]
  );
  const exchanges = useMemo(
    () => [...data.exchanges].filter((entry) => entry.name).slice(0, 5),
    [data.exchanges]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette">
      <Command loop>
        <CommandInput placeholder="Search pages, queues, exchanges or run a command…" />
        <CommandList>
          <CommandEmpty>No matches. Try a queue name or page.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((page) => (
              <CommandItem
                key={page.view}
                value={`page ${page.label}`}
                onSelect={() => run(() => navigate(routeHref(page.view)))}
              >
                <page.icon aria-hidden="true" />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Queues">
            {queues.map((queue) => (
              <CommandItem
                key={`${queue.vhost}/${queue.name}`}
                value={`queue ${queue.name} ${queue.vhost}`}
                onSelect={() => run(() => navigate(routeHref("queue", queue.name)))}
              >
                <ActivityIcon aria-hidden="true" />
                <span className="truncate">{queue.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{queue.vhost}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Exchanges">
            {exchanges.map((exchange) => (
              <CommandItem
                key={`${exchange.vhost}/${exchange.name}`}
                value={`exchange ${exchange.name} ${exchange.vhost}`}
                onSelect={() => run(() => navigate(routeHref("exchange", exchange.name)))}
              >
                <WaypointsIcon aria-hidden="true" />
                <span className="truncate">{exchange.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{exchange.type}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="create queue declare"
              onSelect={() => run(() => openDialog({ type: "add-queue" }))}
            >
              <PlusIcon aria-hidden="true" />
              Add queue
            </CommandItem>
            <CommandItem
              value="create exchange declare"
              onSelect={() => run(() => openDialog({ type: "add-exchange" }))}
            >
              <PlusIcon aria-hidden="true" />
              Add exchange
            </CommandItem>
            <CommandItem
              value="publish message"
              onSelect={() => run(() => openDialog({ type: "publish" }))}
            >
              <SendIcon aria-hidden="true" />
              Publish message
            </CommandItem>
            <CommandItem
              value="toggle live updates pause"
              onSelect={() => run(() => actions.setLive(!live))}
            >
              <ZapIcon aria-hidden="true" />
              {live ? "Pause live updates" : "Resume live updates"}
            </CommandItem>
            <CommandItem
              value="theme dark light mode"
              onSelect={() =>
                run(() => setTheme(theme === "dark" || document.documentElement.classList.contains("dark") ? "light" : "dark"))
              }
            >
              <SunMoonIcon aria-hidden="true" />
              Toggle theme
              <CommandShortcut>d</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="keyboard shortcuts help"
              onSelect={() => run(() => openDialog({ type: "shortcuts" }))}
            >
              <ShieldCheckIcon aria-hidden="true" />
              Keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
