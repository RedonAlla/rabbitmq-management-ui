import { useEffect, useState, type ReactNode } from "react"
import {
  ActivityIcon,
  BoxesIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  CommandIcon,
  FileJsonIcon,
  FlagIcon,
  GaugeIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PlugIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  ServerIcon,
  ShieldCheckIcon,
  SunIcon,
  TriangleAlertIcon,
  UsersIcon,
  WaypointsIcon,
} from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { CommandPalette } from "@/components/command-palette"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useTheme } from "@/components/theme-provider"
import { routeHref, useRoute } from "@/lib/router"
import { fmtAgo } from "@/lib/format"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

const NAV_GROUPS = [
  {
    label: "Cluster",
    items: [{ view: "overview", label: "Overview", icon: LayoutDashboardIcon }],
  },
  {
    label: "Messaging",
    items: [
      {
        view: "queues",
        label: "Queues",
        icon: ListOrderedIcon,
        count: "queues",
      },
      {
        view: "exchanges",
        label: "Exchanges",
        icon: WaypointsIcon,
        count: "exchanges",
      },
      {
        view: "connections",
        label: "Connections",
        icon: PlugIcon,
        count: "connections",
      },
      {
        view: "channels",
        label: "Channels",
        icon: GitBranchIcon,
        count: "channels",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { view: "users", label: "Users", icon: UsersIcon },
      { view: "vhosts", label: "Virtual hosts", icon: BoxesIcon },
      { view: "flags", label: "Feature flags", icon: FlagIcon },
      {
        view: "deprecated",
        label: "Deprecated features",
        icon: TriangleAlertIcon,
      },
      { view: "policies", label: "Policies", icon: ShieldCheckIcon },
      { view: "limits", label: "Limits", icon: GaugeIcon },
      { view: "cluster", label: "Cluster", icon: ServerIcon },
      { view: "definitions", label: "Definitions", icon: FileJsonIcon },
    ],
  },
] as const

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

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    ? Boolean(
        target.closest("input, textarea, select, [contenteditable='true']")
      )
    : false
}

function SidebarNav({ activeFor }: { activeFor: (view: string) => boolean }) {
  const { totals } = useCluster()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarContent>
      {NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = activeFor(item.view)
                const count =
                  "count" in item && item.count
                    ? item.count === "queues"
                      ? totals.queues
                      : item.count === "exchanges"
                        ? totals.exchanges
                        : item.count === "connections"
                          ? totals.connections
                          : totals.channels
                    : undefined
                return (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <a
                          href={routeHref(item.view)}
                          aria-current={isActive ? "page" : undefined}
                        />
                      }
                      onClick={
                        isMobile ? () => setOpenMobile(false) : undefined
                      }
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                      {typeof count === "number" ? (
                        <Badge
                          variant="outline"
                          className="group-data-[collapsible=icon]/menu-button:hidden"
                        >
                          {count}
                        </Badge>
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate } = useRoute()
  const { totals, data, live, status, actions, lastUpdated } = useCluster()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { openDialog } = useDialogs()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const username = user?.username ?? "admin"
  const role = user?.role ?? "administrator"
  const initials = username.slice(0, 2).toUpperCase()

  const signOut = () => {
    logout()
    toast.success("Signed out", {
      description: `${username} is no longer signed in.`,
    })
  }

  useEffect(() => {
    let lastG = 0
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditable(event.target)
      )
        return
      if (event.key === "?") {
        event.preventDefault()
        openDialog({ type: "shortcuts" })
        return
      }
      if (event.key === "/") {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (event.key === "g") {
        lastG = performance.now()
        return
      }
      if (performance.now() - lastG < 900) {
        const routes: Record<string, string> = {
          o: "overview",
          q: "queues",
          e: "exchanges",
          c: "connections",
          u: "users",
          v: "vhosts",
          p: "policies",
          l: "limits",
          f: "flags",
          d: "deprecated",
          k: "cluster",
          i: "definitions",
        }
        const target = routes[event.key.toLowerCase()]
        if (target) {
          event.preventDefault()
          navigate(routeHref(target))
        }
        lastG = 0
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate, openDialog])

  const isDark =
    theme === "dark" ||
    (theme === "system" && document.documentElement.classList.contains("dark"))
  const pageTitle = TITLES[route.view] ?? "Not found"
  const activeFor = (view: string) =>
    route.view === view ||
    (view === "queues" && route.view === "queue") ||
    (view === "exchanges" && route.view === "exchange") ||
    (view === "connections" && route.view === "connection") ||
    (view === "channels" && route.view === "channel")

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="RabbitMQ Management"
                render={
                  <a
                    href={routeHref("overview")}
                    aria-label="RabbitMQ Management overview"
                  />
                }
              >
                <IconTile variant="solid" aria-hidden="true">
                  <span className="text-mono text-sm font-semibold">RQ</span>
                </IconTile>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    RabbitMQ
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {data.cluster.name}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarNav activeFor={activeFor} />

        <SidebarFooter className="p-2">
          <div className="flex flex-col gap-2 border-t border-sidebar-border pt-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full rounded-full bg-success/40" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                Cluster online
              </span>
              <Badge variant="outline">{data.cluster.version}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {data.nodes.length} nodes · {totals.connections} connections
              </span>
              <span className="text-mono">
                {fmtAgo(lastUpdated, new Date().getTime())}
              </span>
            </div>
          </div>
          <SidebarMenu className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Keyboard shortcuts"
                onClick={() => openDialog({ type: "shortcuts" })}
              >
                <CircleHelpIcon aria-hidden="true" />
                <span>Help &amp; shortcuts</span>
                <kbd className="ml-auto border border-sidebar-border bg-sidebar px-1 font-mono text-[0.65rem] text-muted-foreground">
                  ?
                </kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-4">
          <SidebarTrigger aria-label="Toggle navigation" />
          <Separator orientation="vertical" className="my-auto h-4" />
          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-xs text-muted-foreground">
              {data.cluster.name} / {pageTitle}
            </span>
            <span className="truncate text-sm font-medium">{pageTitle}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto min-w-0 flex-1 justify-start gap-2 bg-muted/40 font-normal text-muted-foreground hover:bg-muted hover:text-foreground sm:max-w-xs lg:max-w-sm"
          >
            <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline">
              Search queues, pages, actions…
            </span>
            <span className="truncate sm:hidden">Search</span>
            <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 border border-border bg-background px-1 font-mono text-[0.65rem] sm:flex">
              <CommandIcon aria-hidden="true" className="size-2.5" />K
            </kbd>
          </Button>

          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-1.5 md:flex">
              <span className="text-xs text-muted-foreground">Live</span>
              <Switch
                checked={live}
                onCheckedChange={actions.setLive}
                aria-label="Live updates"
                size="sm"
              />
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Refresh snapshot"
                    onClick={actions.refresh}
                  />
                }
              >
                {status === "loading" ? (
                  <Spinner />
                ) : (
                  <RefreshCwIcon aria-hidden="true" />
                )}
              </TooltipTrigger>
              <TooltipContent>Refresh snapshot</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      isDark ? "Switch to light theme" : "Switch to dark theme"
                    }
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  />
                }
              >
                {isDark ? (
                  <SunIcon aria-hidden="true" />
                ) : (
                  <MoonIcon aria-hidden="true" />
                )}
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Help and diagnostics"
                  />
                }
              >
                <CircleHelpIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Management</DropdownMenuLabel>
                  <DropdownMenuItem onClick={actions.refresh}>
                    <RefreshCwIcon aria-hidden="true" />
                    Refresh snapshot
                    <DropdownMenuShortcut>R</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDialog({ type: "shortcuts" })}
                  >
                    <CircleHelpIcon aria-hidden="true" />
                    Keyboard shortcuts
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={actions.simulateError}
                >
                  <ActivityIcon aria-hidden="true" />
                  Simulate API error
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Account menu for ${username}`}
                  />
                }
              >
                <IconTile
                  variant="soft"
                  size="xs"
                  radius="full"
                  aria-hidden="true"
                >
                  <span className="text-[0.6rem] font-semibold">
                    {initials}
                  </span>
                </IconTile>
                <span className="hidden text-xs font-medium sm:inline">
                  {username}
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {username}
                    </span>
                    <span className="font-normal text-muted-foreground">
                      {role}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => navigate(routeHref("users"))}
                  >
                    <UsersIcon aria-hidden="true" />
                    Manage users
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(routeHref("vhosts"))}
                  >
                    <BoxesIcon aria-hidden="true" />
                    Virtual hosts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDialog({ type: "publish" })}
                  >
                    <SendIcon aria-hidden="true" />
                    Publish message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDialog({ type: "add-queue" })}
                  >
                    <PlusIcon aria-hidden="true" />
                    Add queue
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? (
                    <SunIcon aria-hidden="true" />
                  ) : (
                    <MoonIcon aria-hidden="true" />
                  )}
                  {isDark ? "Light theme" : "Dark theme"}
                  <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDialog({ type: "shortcuts" })}
                >
                  <MonitorIcon aria-hidden="true" />
                  Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOutIcon aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  )
}
