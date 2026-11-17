import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import InfoTooltip from "@/components/ui/info-tooltip"
import { cn } from "@/lib/utils"
import { ConditionalRender } from "../conditional-render"

export default function Field({
  label,
  info,
  htmlFor,
  children,
  className,
}: {
  label: string
  info?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        <ConditionalRender condition={info !== undefined}>
          <InfoTooltip label={`About ${label.toLowerCase()}`}>
            {info}
          </InfoTooltip>
        </ConditionalRender>
      </div>
      {children}
    </div>
  )
}
