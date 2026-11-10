import { Button } from "@/components/ui/button";
import type { Connection } from "@/data/types";
import { UnplugIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  row: Connection;
  setPendingClose: Dispatch<SetStateAction<Connection | null>>;
};

export default function GridActions({ row, setPendingClose }: Props) {
  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        title="Close connection"
        aria-label={`Close connection ${row.name}`}
        onClick={() => setPendingClose(row)}
      >
        <UnplugIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
