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
