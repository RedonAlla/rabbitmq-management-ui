import { Button } from "@/components/ui/button"
import { CommandIcon, SearchIcon } from "lucide-react";
import type { SetStateAction } from "react";

type Props = {
  setPaletteOpen: (value: SetStateAction<boolean>) => void;
}

export function SearchAction({setPaletteOpen}: Props) {  
  return (
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
  )
}
