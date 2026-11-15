import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PrefetchHintContent() {
  return (
    <TooltipContent side="top" className="max-w-72 flex-col items-start gap-1">
      <span className="font-medium">Channel prefetch count.</span>
      <span>
        Each channel can have a prefetch count. The prefetch is the number of
        messages that will be held by the client. Setting a value of 0 will
        result in an unlimited prefetch.
      </span>
    </TooltipContent>
  );
}

export function PrefetchHint() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            aria-label="About channel prefetch count"
            className="inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
          >
            <InfoIcon />
          </span>
        }
      />
      <PrefetchHintContent />
    </Tooltip>
  );
}
