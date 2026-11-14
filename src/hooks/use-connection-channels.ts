import { useCallback, useEffect, useState } from "react"
import {
  fetchConnectionChannels,
  type ConnectionChannel,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

interface ConnectionChannelsResult {
  channels: ConnectionChannel[]
  loading: boolean
  error: string | null
  retry: () => void
}

export function useConnectionChannels(
  name: string | undefined
): ConnectionChannelsResult {
  const { user } = useAuth()
  const token = user?.token
  const [result, setResult] = useState<{
    key: string
    channels: ConnectionChannel[]
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  const requestKey = `${name ?? ""}|${refreshId}`

  useEffect(() => {
    if (!token || !name) return undefined

    const controller = new AbortController()

    fetchConnectionChannels(token, name, controller.signal)
      .then((channels) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, channels })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setFailure({
          key: requestKey,
          message:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        })
      })

    return () => controller.abort()
  }, [token, name, requestKey])

  const retry = useCallback(() => setRefreshId((current) => current + 1), [])

  const error = failure?.key === requestKey ? failure.message : null
  const loaded = result?.key === requestKey ? result.channels : null
  const hasSession = Boolean(token)

  return {
    channels: loaded ?? [],
    loading: Boolean(name) && hasSession && !error && loaded === null,
    error: hasSession
      ? (error ?? (name ? null : "No connection was specified."))
      : "Your session has expired. Sign in again.",
    retry,
  }
}
