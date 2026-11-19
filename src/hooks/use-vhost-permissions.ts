import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import {
  fetchVhostPermissions,
  type VhostPermission,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const POLL_MS = 10000

interface VhostPermissionsResult {
  permissions: VhostPermission[] | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useVhostPermissions(
  name: string | undefined
): VhostPermissionsResult {
  const { user } = useAuth()
  const token = user?.token
  const [result, setResult] = useState<{
    key: string
    permissions: VhostPermission[]
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  const requestKey = `${name ?? ""}|${refreshId}`

  useEffect(() => {
    if (!token || !name) return undefined

    let cancelled = false
    const controller = new AbortController()

    const load = () => {
      fetchVhostPermissions(token, name, controller.signal)
        .then((next) => {
          if (cancelled) return
          setResult({ key: requestKey, permissions: next })
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
  }, [token, name, requestKey])

  const retry = useCallback(() => setRefreshId((current) => current + 1), [])

  const requestError = failure?.key === requestKey ? failure.message : null
  const permissions = result?.key === requestKey ? result.permissions : null
  const hasSession = Boolean(token)

  return {
    permissions,
    loading: Boolean(name) && hasSession && !requestError && !permissions,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
  }
}
