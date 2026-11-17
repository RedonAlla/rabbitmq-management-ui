import type { DialogRequest } from "@/components/dialogs/dialogs-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Exchange, Queue } from "@/data/types"
import { MoreHorizontalIcon, SendIcon, Trash2Icon } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

export type ConfirmState = { kind: "purge" | "delete"; queue: Queue } | null

type Props = {
  row: Exchange
  setPendingDelete: Dispatch<SetStateAction<Exchange | null>>
  openDialog: (request: DialogRequest) => void
}

export function GridActions({
  row,
  setPendingDelete,
  openDialog,
}: Props) {
  return (
    <div
      className="flex justify-end"
      onClick={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${row.name || "default exchange"}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() =>
              openDialog({
                type: "publish",
                vhost: row.vhost,
                exchange: row.name || undefined,
              })
            }
          >
            <SendIcon aria-hidden="true" />
            Publish
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!row.name}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2Icon aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
