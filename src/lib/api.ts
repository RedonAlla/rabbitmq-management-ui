import { API_BASE_URL } from "@/lib/env"

export interface WhoAmI {
  name: string
  tags: string[]
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function failure(response: Response, path: string): Promise<ApiError> {
  if (response.status === 401) {
    return new ApiError("Your session has expired. Sign in again.", 401)
  }

  let message = `RabbitMQ returned HTTP ${response.status} for ${path}.`
  try {
    const payload = (await response.json()) as {
      error?: string
      reason?: string
    }
    const parts = [payload.error, payload.reason].filter(
      (part): part is string => typeof part === "string" && part.length > 0
    )
    if (parts.length > 0) message = parts.join(": ")
  } catch {
    // Non-JSON error body; keep the status message.
  }
  return new ApiError(message, response.status)
}

async function readBody<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function loginWithPassword(
  username: string,
  password: string
): Promise<{ user: WhoAmI; token: string }> {
  const token = btoa(`${username}:${password}`)
  const response = await fetch(`${API_BASE_URL}/api/whoami`, {
    cache: "no-store",
    headers: { Authorization: `Basic ${token}` },
  })

  if (response.status === 401) {
    throw new ApiError("Invalid username or password.", 401)
  }
  if (!response.ok) {
    throw new ApiError(
      `RabbitMQ rejected the sign-in request (HTTP ${response.status}).`,
      response.status
    )
  }

  return { user: (await response.json()) as WhoAmI, token }
}

export async function apiGet<T>(
  path: string,
  token: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Basic ${token}` },
    signal,
  })

  if (!response.ok) throw await failure(response, path)
  return (await response.json()) as T
}

async function sendJson<T>(
  path: string,
  token: string,
  method: "POST" | "PUT",
  body?: unknown
): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) throw await failure(response, path)
  return readBody<T>(response)
}

export function apiPost<T = unknown>(
  path: string,
  token: string,
  body?: unknown
): Promise<T | null> {
  return sendJson<T>(path, token, "POST", body)
}

export function apiPut<T = unknown>(
  path: string,
  token: string,
  body?: unknown
): Promise<T | null> {
  return sendJson<T>(path, token, "PUT", body)
}

export async function apiDelete(
  path: string,
  token: string,
  body?: unknown
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) throw await failure(response, path)
}

export async function apiPostForm<T>(
  path: string,
  body: FormData,
  token: string
): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Basic ${token}` },
    body,
  })

  if (!response.ok) throw await failure(response, path)
  return readBody<T>(response)
}
