import { Switch } from "@/components/ui/switch"

export default function ToggleField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-input px-2.5 py-1">
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      <Switch
        className="shrink-0"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  )
}
