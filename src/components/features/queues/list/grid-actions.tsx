import type { DialogRequest } from "@/components/dialogs/dialogs-provider"
import type { ConfirmState } from "@/components/features/queues/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Queue } from "@/data/types"
import {
  EraserIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

type Props = {
  rowData: Queue
  setConfirm: Dispatch<SetStateAction<ConfirmState>>
  openDialog: (request: DialogRequest) => void
}

export function GridActions({
  rowData,
  setConfirm,
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
              aria-label={`Actions for ${rowData.name}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() =>
              openDialog({ type: "publish", vhost: rowData.vhost })
            }
          >
            <SendIcon aria-hidden="true" />
            Publish
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirm({ kind: "purge", queue: rowData })}
          >
            <EraserIcon aria-hidden="true" />
            Purge
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirm({ kind: "delete", queue: rowData })}
          >
            <Trash2Icon aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
