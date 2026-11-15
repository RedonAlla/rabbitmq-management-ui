import {
  MoonIcon,
  SunIcon,
} from "lucide-react";

type Props = {
  isDark: boolean;
}

export function ThemeIcon({isDark}: Props) {
  return (
    isDark
      ? <SunIcon aria-hidden="true" />
      : <MoonIcon aria-hidden="true" />
  )
}
