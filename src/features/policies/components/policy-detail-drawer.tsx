import type { ReactNode } from "react"
import { Trash2Icon } from "lucide-react"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { fmtInt } from "@/lib/format"
import type { Policy } from "@/data/types"

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "data-cell max-w-[65%] text-right text-sm"
            : "max-w-[65%] text-right text-sm"
        }
      >
        {value}
      </dd>
    </div>
  )
}

type Props = {
  policy: Policy | null
  open: boolean
  onOpenChange: (open: boolean) => void
  applied: number
  kind: "user" | "operator"
  onDelete: (policy: Policy) => void
}

export default function PolicyDetailDrawer({
  policy,
  open,
  onOpenChange,
  applied,
  kind,
  onDelete,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {policy ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <SheetTitle className="truncate">{policy.name}</SheetTitle>
                <Badge variant="outline">P{policy.priority}</Badge>
                <Badge variant={kind === "operator" ? "info-light" : "outline"}>
                  {kind === "operator" ? "Operator" : "User"}
                </Badge>
              </div>
              <SheetDescription>
                {policy.vhost} · {policy.applyTo}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
              <dl className="flex flex-col divide-y divide-border">
                <DetailRow label="Virtual host" value={policy.vhost} />
                <DetailRow label="Pattern" value={policy.pattern} mono />
                <DetailRow
                  label="Applies to"
                  value={<span className="capitalize">{policy.applyTo}</span>}
                />
                <DetailRow label="Priority" value={policy.priority} />
                <DetailRow
                  label="Applied"
                  value={`${fmtInt(applied)} ${applied === 1 ? "queue" : "queues"}`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Definition
                </h3>
                <dl className="flex flex-col divide-y divide-border">
                  {Object.entries(policy.definition).map(([key, value]) => (
                    <DetailRow
                      key={key}
                      label={key}
                      value={String(value)}
                      mono
                    />
                  ))}
                </dl>
              </div>
            </div>

            <SheetFooter className="border-t sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(policy)}
              >
                <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                Delete {kind === "operator" ? "operator policy" : "policy"}
              </Button>
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
