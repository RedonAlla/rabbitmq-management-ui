import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { argumentText } from "@/lib/properties"

export function ConsumerArguments({
  tag,
  arguments: consumerArguments,
}: {
  tag: string
  arguments: Record<string, unknown>
}) {
  const entries = Object.entries(consumerArguments)
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="data-cell"
            aria-label={`Show arguments for ${tag}`}
          >
            {entries.length}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Arguments</PopoverTitle>
          <span className="data-cell text-xs text-muted-foreground">{tag}</span>
        </PopoverHeader>
        {entries.length ? (
          <dl className="flex max-h-64 flex-col divide-y divide-border overflow-auto">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
              >
                <dt className="data-cell text-xs [overflow-wrap:anywhere] text-muted-foreground">
                  {key}
                </dt>
                <dd className="data-cell max-w-[60%] text-right text-xs [overflow-wrap:anywhere]">
                  {argumentText(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            This consumer has no arguments.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
