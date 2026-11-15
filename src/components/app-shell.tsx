import { useEffect, useState, type ReactNode } from "react"
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { CommandPalette } from "@/components/command-palette"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { routeHref, useRoute } from "@/lib/router"
import {
  useCluster,
  type RefreshInterval,
} from "@/store/cluster"
import {
  NavigationItems,
  NavigationHeader,
  NavigationFooter
} from "./layout/navigation"
import {
  AppHeader} from "./layout/header"

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

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    ? Boolean(
        target.closest("input, textarea, select, [contenteditable='true']")
      )
    : false
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate } = useRoute()
  const { totals, data, actions, lastUpdated, refreshInterval } = useCluster()
  
  const { openDialog } = useDialogs()
  const [paletteOpen, setPaletteOpen] = useState(false)

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
  
  const activeFor = (view: string) =>
    route.view === view ||
    (view === "queues" && route.view === "queue") ||
    (view === "exchanges" && route.view === "exchange") ||
    (view === "connections" && route.view === "connection") ||
    (view === "channels" && route.view === "channel")

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <NavigationHeader clusterName={data.cluster.name} />

        <NavigationItems activeFor={activeFor} />

        <NavigationFooter
          lastUpdated={lastUpdated}
          version={data.cluster.version}
          erlang={data.cluster.erlang}
          totalNodes={data.nodes.length}
          totalConnections={totals.connections}
        />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <AppHeader
          clusterName={data.cluster.name}
          route={route.view}
          refreshInterval={refreshInterval}
          refresh={actions.refresh}
          setPaletteOpen={setPaletteOpen}
          setRefreshInterval={(value) =>
            actions.setRefreshInterval(
              Number(value) as RefreshInterval
            )
          }
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  )
}
