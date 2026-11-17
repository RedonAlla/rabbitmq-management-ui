import type { ReactNode } from "react"
import { Alert, AlertDescription } from "../reui/alert"
import { CircleAlertIcon } from "lucide-react"

export default function FormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
