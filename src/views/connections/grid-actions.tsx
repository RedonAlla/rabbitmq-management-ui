import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Connection, Queue } from "@/data/types";
import { MoreHorizontalIcon, UnplugIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

export type ConfirmState = { kind: "purge" | "delete"; queue: Queue } | null;

type Props = {
  row: Connection;
  setPendingClose: Dispatch<SetStateAction<Connection | null>>;
};

export default function GridActions({ row, setPendingClose }: Props) {
  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${row.name}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setPendingClose(row)}
          >
            <UnplugIcon aria-hidden="true" />
            Close connection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
