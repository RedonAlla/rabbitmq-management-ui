import type { ReactNode } from "react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { cn } from "@/lib/utils";

export interface Fact {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

export function FactPanel({
  title,
  description,
  facts,
  footer,
}: {
  title: string;
  description?: string;
  facts: Fact[];
  footer?: ReactNode;
}) {
  return (
    <Frame spacing="sm" className="min-w-0">
      <FrameHeader className="flex flex-col gap-0.5">
        <FrameTitle>{title}</FrameTitle>
        {description ? <FrameDescription>{description}</FrameDescription> : null}
      </FrameHeader>
      <FramePanel className="flex flex-col">
        <dl className="flex flex-col divide-y divide-border">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
            >
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd
                className={cn(
                  "max-w-[65%] text-right text-sm [overflow-wrap:anywhere]",
                  fact.mono && "data-cell"
                )}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </FramePanel>
      {footer ? footer : null}
    </Frame>
  );
}

export function DetailLayout({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">{main}</div>
      <div className="flex min-w-0 flex-col gap-4">{side}</div>
    </div>
  );
}

export function SectionFrame({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Frame spacing="sm" className={cn("min-w-0", className)}>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <FrameTitle>{title}</FrameTitle>
          {description ? <FrameDescription>{description}</FrameDescription> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </FrameHeader>
      <FramePanel className={cn("min-w-0", bodyClassName)}>{children}</FramePanel>
    </Frame>
  );
}
