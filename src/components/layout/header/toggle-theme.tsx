import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import { ThemeIcon } from "./theme-icon"

export function ToggleTheme() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" && document.documentElement.classList.contains("dark"))

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        <ThemeIcon isDark />
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  )
}
