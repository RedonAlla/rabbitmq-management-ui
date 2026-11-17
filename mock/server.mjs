// Node adapter for the transport-agnostic mock handler.
// Run with: npm run mock
import { createServer } from "node:http"

import { handleMockRequest } from "./handler.mjs"

const PORT = Number(process.env.MOCK_PORT ?? 15673)

createServer(handleMockRequest).listen(PORT, () => {
  console.log(`Mock RabbitMQ Management API listening on http://localhost:${PORT}`)
  console.log("Sign in with admin / admin (or guest / guest).")
})
