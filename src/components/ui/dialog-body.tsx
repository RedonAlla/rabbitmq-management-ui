import type { ReactNode } from "react";

export default function DialogBody({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4">{children}</div>;
}
