import { API_BASE_URL } from "@/lib/env"

export interface RabbitLoginResponse {
  user: { name: string; tags: string[] }
  token: { type: string; value: string }
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function loginWithPassword(
  username: string,
  password: string
): Promise<RabbitLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    body: new URLSearchParams({ username, password }),
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

  return (await response.json()) as RabbitLoginResponse
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

  if (response.status === 401) {
    throw new ApiError("Your session has expired. Sign in again.", 401)
  }
  if (!response.ok) {
    throw new ApiError(
      `RabbitMQ returned HTTP ${response.status} for ${path}.`,
      response.status
    )
  }

  return (await response.json()) as T
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

  if (response.status === 401) {
    throw new ApiError("Your session has expired. Sign in again.", 401)
  }
  if (!response.ok) {
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
    throw new ApiError(message, response.status)
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
