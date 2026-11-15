import * as React from "react";

export type Props = {
  condition: boolean;
  default?: React.ReactElement;
  children: React.ReactNode;
}

export function ConditionalRender({ condition, default: defaultValue, children }: Props): React.ReactNode {
  return condition ? children : defaultValue ?? null;
}