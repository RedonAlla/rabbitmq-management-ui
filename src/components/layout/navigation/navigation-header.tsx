import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { routeHref } from "@/lib/router"

type Props = {
  clusterName: string
}

export function NavigationHeader({ clusterName }: Props) {
  return (
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
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="size-10 shrink-0 rounded-lg bg-[#181714] p-1"
            />
            <div className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">
                RabbitMQ
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {clusterName}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
