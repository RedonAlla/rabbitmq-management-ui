import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
const RABBITMQ_TARGET = "http://localhost:15672"

const proxy = {
  "/api": { target: RABBITMQ_TARGET, changeOrigin: true },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: { proxy },
  preview: { proxy },
})
