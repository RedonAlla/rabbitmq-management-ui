import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Queue } from "@/data/types"
import {
  deleteQueue as deleteQueueRequest,
  fetchQueues,
  purgeQueue as purgeQueueRequest,
  type QueuesPage,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const SORT_FIELDS: Record<string, string> = {
  name: "name",
  type: "type",
  consumers: "consumers",
  state: "state",
  ready: "messages_ready",
  unacked: "messages_unacknowledged",
  memory: "memory",
}

const EMPTY_PAGE: QueuesPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 100,
  pageCount: 0,
}

interface QueuesQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  vhost?: string
  sorting: SortingState
}

interface QueuesQueryResult {
  queues: Queue[]
  totalCount: number
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
  purgeQueue: (vhost: string, name: string) => Promise<void>
  deleteQueue: (vhost: string, name: string) => Promise<void>
}

export function useQueues(options: QueuesQueryOptions): QueuesQueryResult {
  const { user } = useAuth()
  const [result, setResult] = useState<{
    key: string
    page: QueuesPage
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)

  const { pageIndex, pageSize, search, vhost, sorting } = options
  const sort = sorting[0]
  const sortField = sort ? SORT_FIELDS[sort.id] : undefined
  const sortReverse = sort?.desc ?? false
  const token = user?.token
  const requestKey = [
    pageIndex,
    pageSize,
    search,
    vhost ?? "",
    sortField ?? "",
    sortReverse,
    refreshId,
  ].join("|")

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    fetchQueues(
      token,
      {
        page: pageIndex + 1,
        pageSize,
        name: search,
        vhost,
        sort: sortField,
        sortReverse,
      },
      controller.signal
    )
      .then((next) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, page: next })
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
  }, [token, pageIndex, pageSize, search, vhost, sortField, sortReverse, requestKey])

  const retry = useCallback(() => {
    setRefreshId((current) => current + 1)
  }, [])

  const purgeQueue = useCallback(
    async (vhost: string, name: string) => {
      if (!token) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await purgeQueueRequest(token, vhost, name)
      setRefreshId((current) => current + 1)
    },
    [token]
  )

  const deleteQueue = useCallback(
    async (vhost: string, name: string) => {
      if (!token) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await deleteQueueRequest(token, vhost, name)
      setRefreshId((current) => current + 1)
    },
    [token]
  )

  const requestError = failure?.key === requestKey ? failure.message : null
  const currentPage = requestError ? EMPTY_PAGE : (result?.page ?? EMPTY_PAGE)
  const hasSession = Boolean(token)

  return {
    queues: currentPage.items,
    totalCount: currentPage.totalCount,
    filteredCount: currentPage.filteredCount,
    pageCount: currentPage.pageCount,
    loading: hasSession && !requestError && result?.key !== requestKey,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
    purgeQueue,
    deleteQueue,
  }
}
