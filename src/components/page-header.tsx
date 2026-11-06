import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, children }: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <div className="flex items-center gap-2">{eyebrow}</div> : null}
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
