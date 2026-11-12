import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import {
  fetchChannelDetail,
  type ChannelDetail,
  type ChannelRateRange,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const POLL_MS = 10000

interface ChannelDetailResult {
  detail: ChannelDetail | null
  loading: boolean
  error: string | null
  status: number | null
  retry: () => void
}

export function useChannelDetail(
  name: string | undefined,
  range: ChannelRateRange = 60
): ChannelDetailResult {
  const { user } = useAuth()
  const token = user?.token
  const [result, setResult] = useState<{
    key: string
    detail: ChannelDetail
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
    status: number | null
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  const requestKey = `${name ?? ""}|${range}|${refreshId}`

  useEffect(() => {
    if (!token || !name) return undefined

    let cancelled = false
    const controller = new AbortController()

    const load = () => {
      fetchChannelDetail(token, name, range, controller.signal)
        .then((next) => {
          if (cancelled) return
          setResult({ key: requestKey, detail: next })
          setFailure(null)
        })
        .catch((cause: unknown) => {
          if (cancelled) return
          setFailure({
            key: requestKey,
            message:
              cause instanceof Error
                ? cause.message
                : "The management API did not respond.",
            status: cause instanceof ApiError ? cause.status : null,
          })
        })
    }

    void load()
    const timer = window.setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(timer)
    }
  }, [token, name, range, requestKey])

  const retry = useCallback(() => setRefreshId((current) => current + 1), [])

  const requestError = failure?.key === requestKey ? failure.message : null
  const requestStatus = failure?.key === requestKey ? failure.status : null
  const detail = result?.key === requestKey ? result.detail : null
  const hasSession = Boolean(token)

  return {
    detail,
    loading: Boolean(name) && hasSession && !requestError && !detail,
    error: hasSession
      ? (requestError ?? (name ? null : "No channel was specified."))
      : "Your session has expired. Sign in again.",
    status: requestStatus,
    retry,
  }
}
