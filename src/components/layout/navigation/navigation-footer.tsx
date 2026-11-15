import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CircleHelpIcon } from "lucide-react"
import { useDialogs } from "../../dialogs/dialogs-provider"
import { fmtAgo } from "@/lib/format"
import { Badge } from "../../reui/badge"

type Props = {
  lastUpdated: number;
  version: string;
  erlang: string;
  totalNodes: number;
  totalConnections: number;
}

export function NavigationFooter({
  lastUpdated,
  version,
  erlang,
  totalNodes,
  totalConnections
}: Props) {
  const { openDialog } = useDialogs();

  return (
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
          <span className="shrink-0 text-mono text-xs text-muted-foreground">
            {fmtAgo(lastUpdated, new Date().getTime())}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">RabbitMQ {version}</Badge>
          <Badge variant="outline">Erlang {erlang}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalNodes} nodes · {totalConnections} connections
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
  )
}
