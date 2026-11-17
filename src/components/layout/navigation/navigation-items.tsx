import {
  BoxesIcon,
  FileJsonIcon,
  FlagIcon,
  GaugeIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  PlugIcon,
  ServerIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersIcon,
  WaypointsIcon,
} from "lucide-react"
import { Badge } from "@/components/reui/badge"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { routeHref } from "@/lib/router"
import { useCluster } from "@/store/cluster"

type Props = {
  activeFor: (view: string) => boolean
}

const NAV_GROUPS = [
  {
    label: "Cluster",
    items: [
      {
        view: "overview",
        label: "Overview",
        icon: LayoutDashboardIcon,
      },
    ],
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

export function NavigationItems({ activeFor }: Props) {
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
