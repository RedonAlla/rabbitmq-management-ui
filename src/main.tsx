import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { DialogsProvider } from "@/components/dialogs/dialogs-provider"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { RouterProvider } from "@/lib/router"
import { AuthProvider } from "@/store/auth"
import { ClusterProvider } from "@/store/cluster"

if (import.meta.env.MODE === "demo") {
  const { installMockBackend } = await import("@/lib/mock-backend")
  installMockBackend()
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="rmq-theme">
      <TooltipProvider>
        <RouterProvider>
          <AuthProvider>
            <ClusterProvider>
              <DialogsProvider>
                <App />
              </DialogsProvider>
            </ClusterProvider>
          </AuthProvider>
        </RouterProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
