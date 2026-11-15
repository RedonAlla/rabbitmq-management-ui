import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleHelpIcon, RefreshCwIcon } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";

type Props = {
  refresh: () => void
}

export function HelpActions({refresh}: Props) {
  const { openDialog } = useDialogs();
  
  return (
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
          <DropdownMenuItem onClick={refresh}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
