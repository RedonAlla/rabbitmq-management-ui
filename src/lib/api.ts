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

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Basic ${token}` },
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
