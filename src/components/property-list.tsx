import { propertyText, type PropertyEntry } from "@/lib/properties"

export function PropertyList({ entries }: { entries: PropertyEntry[] }) {
  if (!entries.length) {
    return (
      <p className="text-xs text-muted-foreground">
        The broker did not report any properties.
      </p>
    )
  }
  return (
    <dl className="flex flex-col divide-y divide-border">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
        >
          <dt className="data-cell text-xs [overflow-wrap:anywhere] text-muted-foreground">
            {label}
          </dt>
          <dd className="data-cell max-w-[65%] text-right text-sm [overflow-wrap:anywhere]">
            {propertyText(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
