import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Channel } from "@/data/types"
import {
  closeChannel as closeChannelRequest,
  fetchChannels,
  type ChannelsPage,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const SORT_FIELDS: Record<string, string> = {
  id: "name",
  vhost: "vhost",
  user: "user",
  node: "node",
  state: "state",
  consumers: "consumer_count",
  prefetch: "prefetch_count",
  unacked: "messages_unacknowledged",
  messagesUncommitted: "messages_uncommitted",
  messagesUnconfirmed: "messages_unconfirmed",
  acksUncommitted: "acks_uncommitted",
}

const EMPTY_PAGE: ChannelsPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 100,
  pageCount: 0,
}

interface ChannelsQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  sorting: SortingState
}

interface ChannelsQueryResult {
  channels: Channel[]
  totalCount: number
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
  closeChannel: (name: string) => Promise<void>
}

export function useChannels(
  options: ChannelsQueryOptions
): ChannelsQueryResult {
  const { user } = useAuth()
  const [result, setResult] = useState<{
    key: string
    page: ChannelsPage
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
  ].join("|")

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    fetchChannels(
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
  }, [token, pageIndex, pageSize, search, sortField, sortReverse, requestKey])

  const retry = useCallback(() => {
    setRefreshId((current) => current + 1)
  }, [])

  const closeChannel = useCallback(
    async (name: string) => {
      if (!token) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await closeChannelRequest(token, name)
      setRefreshId((current) => current + 1)
    },
    [token]
  )

  const requestError = failure?.key === requestKey ? failure.message : null
  const currentPage = requestError ? EMPTY_PAGE : (result?.page ?? EMPTY_PAGE)
  const hasSession = Boolean(token)

  return {
    channels: currentPage.items,
    totalCount: currentPage.totalCount,
    filteredCount: currentPage.filteredCount,
    pageCount: currentPage.pageCount,
    loading: hasSession && !requestError && result?.key !== requestKey,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
    closeChannel,
  }
}
