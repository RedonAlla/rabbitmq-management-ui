import { Skeleton } from "./ui/skeleton";

export const numericMeta = {
  headerClassName: "w-px whitespace-nowrap text-end [&>div]:justify-end",
  cellClassName: "w-px whitespace-nowrap text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-12" />,
}

export const fitMeta = {
  headerClassName: "w-px whitespace-nowrap",
  cellClassName: "w-px whitespace-nowrap",
  skeleton: <Skeleton className="ms-auto h-4 w-12" />,
}