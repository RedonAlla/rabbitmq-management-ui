import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { IS_DEMO } from "@/lib/env"
import {
  closeConnection as closeConnectionRequest,
  fetchConnectionDetail,
  type ConnectionDetail,
  type ConnectionRateRange,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

interface ConnectionDetailResult {
  connection: ConnectionDetail | null
  loading: boolean
  error: string | null
  status: number | null
  retry: () => void
  closeConnection: (reason: string) => Promise<void>
}

export function useConnectionDetail(
  name: string | undefined,
  range: ConnectionRateRange = 60
): ConnectionDetailResult {
  const { user } = useAuth()
  const token = user?.token
  const [result, setResult] = useState<{
    key: string
    connection: ConnectionDetail
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
    status: number | null
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  const requestKey = `${name ?? ""}|${range}|${refreshId}`

  useEffect(() => {
    if (IS_DEMO || !token || !name) return undefined

    const controller = new AbortController()

    fetchConnectionDetail(token, name, range, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, connection: next })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setFailure({
          key: requestKey,
          message:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
          status: cause instanceof ApiError ? cause.status : null,
        })
      })

    return () => controller.abort()
  }, [token, name, range, requestKey])

  const retry = useCallback(() => setRefreshId((current) => current + 1), [])

  const closeConnection = useCallback(
    async (reason: string) => {
      if (!token || !name) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await closeConnectionRequest(token, name, reason)
    },
    [token, name]
  )

  if (IS_DEMO) {
    return {
      connection: null,
      loading: false,
      error: null,
      status: null,
      retry,
      closeConnection,
    }
  }

  const requestError = failure?.key === requestKey ? failure.message : null
  const requestStatus = failure?.key === requestKey ? failure.status : null
  const connection = result?.key === requestKey ? result.connection : null
  const hasSession = Boolean(token)

  return {
    connection,
    loading: Boolean(name) && hasSession && !requestError && !connection,
    error: hasSession
      ? (requestError ??
        (name ? null : "No connection was specified."))
      : "Your session has expired. Sign in again.",
    status: requestStatus,
    retry,
    closeConnection,
  }
}
