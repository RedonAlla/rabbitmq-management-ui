import { Switch } from "@/components/ui/switch"
import InfoTooltip from "@/components/ui/info-tooltip"

export default function ToggleField({
  label,
  info,
  checked,
  onCheckedChange,
}: {
  label: string
  info?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-input px-2.5 py-1">
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-medium">{label}</span>
        {info ? (
          <InfoTooltip label={`About ${label.toLowerCase()}`}>
            {info}
          </InfoTooltip>
        ) : null}
      </span>
      <Switch
        className="shrink-0"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  )
}
