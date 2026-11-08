import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { User } from "@/data/types";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

export type ConfirmState = { kind: "purge" | "delete"; queue: User } | null;

type Props = {
  row: User;
  setPendingDelete: Dispatch<SetStateAction<User | null>>;
};

export default function GridActions({ row, setPendingDelete }: Props) {
  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
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
  );
}
