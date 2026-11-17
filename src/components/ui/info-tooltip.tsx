import type { ReactNode } from "react"
import { InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Props = {
  label: string
  children: ReactNode
}

export default function InfoTooltip({ label, children }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={label}
            />
          }
        >
          <InfoIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-pretty">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
