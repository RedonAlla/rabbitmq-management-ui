import { ChevronDownIcon, TimerIcon } from "lucide-react"
import { REFRESH_INTERVALS, type RefreshInterval } from "@/store/cluster"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type Props = {
  refreshInterval: RefreshInterval
  setRefreshInterval: (value: RefreshInterval) => void
}

export function RefreshActions({ refreshInterval, setRefreshInterval }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Auto-refresh every ${refreshInterval} seconds`}
          />
        }
      >
        <TimerIcon aria-hidden="true" />
        <span className="tabular-nums">{refreshInterval}s</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Auto-refresh</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(refreshInterval)}
            onValueChange={setRefreshInterval}
          >
            {REFRESH_INTERVALS.map((seconds) => (
              <DropdownMenuRadioItem
                key={seconds}
                value={String(seconds)}
                closeOnClick
              >
                Every {seconds}s
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
