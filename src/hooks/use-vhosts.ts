import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Vhost } from "@/data/types"
import { fetchVhosts, type VhostsPage } from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

const SORT_FIELDS: Record<string, string> = {
  name: "name",
  description: "description",
  defaultQueueType: "default_queue_type",
  protectedFromDeletion: "protected_from_deletion",
  tracing: "tracing",
  tags: "tags",
}

const EMPTY_PAGE: VhostsPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 10,
  pageCount: 0,
}

interface VhostsQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  sorting: SortingState
}

interface VhostsQueryResult {
  vhosts: Vhost[]
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
}

export function useVhosts(options: VhostsQueryOptions): VhostsQueryResult {
  const { user } = useAuth()
  const { revision } = useCluster()
  const [result, setResult] = useState<{
    key: string
    page: VhostsPage
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)

  const { pageIndex, pageSize, search, sorting } = options
  const sort = sorting[0]
  const sortField = sort ? SORT_FIELDS[sort.id] : undefined
  const sortReverse = sort?.desc ?? false
  const token = user?.token
  const requestKey = [
    pageIndex,
    pageSize,
    search,
    sortField ?? "",
    sortReverse,
    refreshId,
    revision,
  ].join("|")

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    fetchVhosts(
      token,
      {
        page: pageIndex + 1,
        pageSize,
        name: search,
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
  }, [
    token,
    pageIndex,
    pageSize,
    search,
    sortField,
    sortReverse,
    requestKey,
  ])

  const retry = useCallback(() => {
    setRefreshId((current) => current + 1)
  }, [])

  const requestError = failure?.key === requestKey ? failure.message : null
  const currentPage = requestError ? EMPTY_PAGE : (result?.page ?? EMPTY_PAGE)
  const hasSession = Boolean(token)

  return {
    vhosts: currentPage.items,
    filteredCount: currentPage.filteredCount,
    pageCount: currentPage.pageCount,
    loading: hasSession && !requestError && result?.key !== requestKey,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
  }
}
