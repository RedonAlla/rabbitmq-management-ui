import { API_BASE_URL } from "@/lib/env"
import { handleMockRequest } from "../../mock/handler.mjs"

const encoder = new TextEncoder()

interface MockResult {
  status: number
  headers: Record<string, string>
  body: ArrayBuffer | null
}

async function runMock(request: Request, url: URL): Promise<MockResult> {
  const body = new Uint8Array(await request.arrayBuffer())
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  const req = {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers,
    async *[Symbol.asyncIterator]() {
      if (body.length > 0) yield body
    },
  }

  let status = 200
  let responseHeaders: Record<string, string> = {}
  let payload: ArrayBuffer | null = null
  let finish = () => {}
  const done = new Promise<void>((resolve) => {
    finish = resolve
  })

  const res = {
    writeHead(code: number, extra: Record<string, string> = {}) {
      status = code
      responseHeaders = { ...responseHeaders, ...extra }
    },
    end(chunk?: string | Uint8Array) {
      if (typeof chunk === "string") payload = encoder.encode(chunk).buffer
      else if (chunk instanceof Uint8Array) payload = new Uint8Array(chunk).buffer
      finish()
    },
  }

  handleMockRequest(req, res).catch((cause: unknown) => {
    status = 500
    responseHeaders = { "Content-Type": "application/json" }
    payload = encoder.encode(
      JSON.stringify({
        error: "internal_error",
        reason: cause instanceof Error ? cause.message : "Mock backend failed",
      })
    ).buffer
    finish()
  })

  await done
  return { status, headers: responseHeaders, body: payload }
}

function isApiRequest(url: URL): boolean {
  if (API_BASE_URL) {
    const base = new URL(API_BASE_URL, window.location.origin)
    return url.origin === base.origin && url.pathname.startsWith("/api/")
  }
  return url.origin === window.location.origin && url.pathname.startsWith("/api/")
}

export function installMockBackend(): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url, window.location.origin)
    if (!isApiRequest(url)) return originalFetch(input, init)

    const result = await runMock(request, url)
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }

  console.info("Demo mode: /api requests are served by the in-browser mock.")
}
