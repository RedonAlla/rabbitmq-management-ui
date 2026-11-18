import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { fetchUserDetail, type UserDetail } from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

interface UserDetailResult {
  detail: UserDetail | null
  loading: boolean
  error: string | null
  status: number | null
  retry: () => void
}

export function useUserDetail(username: string | undefined): UserDetailResult {
  const { user } = useAuth()
  const { revision } = useCluster()
  const token = user?.token
  const [result, setResult] = useState<{
    key: string
    detail: UserDetail
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
    status: number | null
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  const requestKey = `${username ?? ""}|${refreshId}|${revision}`

  useEffect(() => {
    if (!token || !username) return undefined

    const controller = new AbortController()

    fetchUserDetail(token, username, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, detail: next })
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
  }, [token, username, requestKey])

  const retry = useCallback(() => setRefreshId((current) => current + 1), [])

  const requestError = failure?.key === requestKey ? failure.message : null
  const requestStatus = failure?.key === requestKey ? failure.status : null
  const detail = result?.key === requestKey ? result.detail : null
  const hasSession = Boolean(token)

  return {
    detail,
    loading: Boolean(username) && hasSession && !requestError && !detail,
    error: hasSession
      ? (requestError ?? (username ? null : "No user was specified."))
      : "Your session has expired. Sign in again.",
    status: requestStatus,
    retry,
  }
}
