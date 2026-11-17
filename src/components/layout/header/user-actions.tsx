import {
  BoxesIcon,
  ChevronDownIcon,
  LogOutIcon,
  MonitorIcon,
  PlusIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { ThemeIcon } from "./theme-icon"
import { useAuth } from "@/store/auth"
import { toast } from "sonner"
import { routeHref, useRoute } from "@/lib/router"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { IconTile } from "@/components/reui/icon-tile"


export function UserActions() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme();
  const { navigate } = useRoute();
  const { openDialog } = useDialogs();

  const username = user?.username ?? "admin";
  const role = user?.role ?? "administrator";
  const initials = username.slice(0, 2).toUpperCase()


  const isDark =
    theme === "dark" ||
    (theme === "system" && document.documentElement.classList.contains("dark"))
  
  const signOut = () => {
      logout()
      toast.success("Signed out", {
        description: `${username} is no longer signed in.`,
      })
    }

  return (
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
          <ThemeIcon isDark />
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
  )
}
