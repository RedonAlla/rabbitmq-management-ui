import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchQueueMessages,
  type QueueMessage,
  type QueueMessageCount,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

interface QueueMessagesResult {
  messages: QueueMessage[] | null
  loading: boolean
  error: string | null
  count: QueueMessageCount
  setCount: (count: QueueMessageCount) => void
  load: () => void
}

export function useQueueMessages(
  vhost: string | undefined,
  name: string | undefined
): QueueMessagesResult {
  const { user } = useAuth()
  const token = user?.token
  const [count, setCount] = useState<QueueMessageCount>(10)
  const [result, setResult] = useState<{
    key: string
    messages: QueueMessage[]
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [pending, setPending] = useState(false)
  const requestId = useRef(0)
  const queueKey = `${vhost ?? ""}|${name ?? ""}`

  const load = useCallback(() => {
    if (!token || vhost === undefined || name === undefined) return
    const id = ++requestId.current
    setPending(true)
    setFailure(null)
    fetchQueueMessages(token, vhost, name, count)
      .then((messages) => {
        if (id !== requestId.current) return
        setResult({ key: queueKey, messages })
        setPending(false)
      })
      .catch((cause: unknown) => {
        if (id !== requestId.current) return
        setFailure({
          key: queueKey,
          message:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        })
        setPending(false)
      })
  }, [token, vhost, name, count, queueKey])

  useEffect(() => {
    requestId.current += 1
    setResult(null)
    setFailure(null)
    setPending(false)
  }, [queueKey])

  return {
    messages: result?.key === queueKey ? result.messages : null,
    loading: pending,
    error: token
      ? failure?.key === queueKey
        ? failure.message
        : null
      : "Your session has expired. Sign in again.",
    count,
    setCount,
    load,
  }
}
