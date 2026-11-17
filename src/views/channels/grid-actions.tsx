import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Channel, Queue } from "@/data/types"
import { MoreHorizontalIcon, XIcon } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

export type ConfirmState = { kind: "purge" | "delete"; queue: Queue } | null

type Props = {
  row: Channel
  setPendingClose: Dispatch<SetStateAction<Channel | null>>
}

export default function GridActions({ row, setPendingClose }: Props) {
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
              aria-label={`Actions for channel ${row.id}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setPendingClose(row)}
          >
            <XIcon aria-hidden="true" />
            Close channel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
