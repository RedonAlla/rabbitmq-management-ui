import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Exchange } from "@/data/types"
import { fetchExchanges, type ExchangesPage } from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

const SORT_FIELDS: Record<string, string> = {
  name: "name",
  vhost: "vhost",
  type: "type",
  publishIn: "message_stats.publish_in",
  publishRate: "message_stats.publish_in_details.rate",
  publishOut: "message_stats.publish_out",
  deliverRate: "message_stats.publish_out_details.rate",
  autoDelete: "auto_delete",
}

const EMPTY_PAGE: ExchangesPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 100,
  pageCount: 0,
}

interface ExchangesQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  vhost?: string
  sorting: SortingState
}

interface ExchangesQueryResult {
  exchanges: Exchange[]
  totalCount: number
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
}

export function useExchanges(
  options: ExchangesQueryOptions
): ExchangesQueryResult {
  const { user } = useAuth()
  const { revision } = useCluster()
  const [result, setResult] = useState<{
    key: string
    page: ExchangesPage
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
    revision,
  ].join("|")

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    fetchExchanges(
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
  }, [
    token,
    pageIndex,
    pageSize,
    search,
    vhost,
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
    exchanges: currentPage.items,
    totalCount: currentPage.totalCount,
    filteredCount: currentPage.filteredCount,
    pageCount: currentPage.pageCount,
    loading: hasSession && !requestError && result?.key !== requestKey,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
  }
}
