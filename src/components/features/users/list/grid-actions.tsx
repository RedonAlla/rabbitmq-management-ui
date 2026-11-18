import type { DialogRequest } from "@/components/dialogs/dialogs-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/data/types"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

export type ConfirmState = { kind: "purge" | "delete"; queue: User } | null

type Props = {
  row: User
  setPendingDelete: Dispatch<SetStateAction<User | null>>
  openDialog: (request: DialogRequest) => void
}

export function GridActions({ row, setPendingDelete, openDialog }: Props) {
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
              aria-label={`Actions for ${row.username}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => openDialog({ type: "edit-user", user: row })}
          >
            <PencilIcon aria-hidden="true" />
            Edit user
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={row.username === "admin"}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2Icon aria-hidden="true" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
