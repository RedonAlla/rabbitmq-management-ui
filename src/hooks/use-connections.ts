import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Connection } from "@/data/types"
import {
  closeConnection as closeConnectionRequest,
  fetchConnections,
  type ConnectionsPage,
} from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const SORT_FIELDS: Record<string, string> = {
  name: "client_properties.connection_name",
  user: "user",
  vhost: "vhost",
  state: "state",
  node: "node",
  protocol: "protocol",
  channels: "channels",
  recvRate: "recv_oct_details.rate",
  sendRate: "send_oct_details.rate",
  connectedAt: "connected_at",
  client: "client_properties.product",
}

const EMPTY_PAGE: ConnectionsPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 100,
  pageCount: 0,
}

interface ConnectionsQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  vhost?: string
  sorting: SortingState
}

interface ConnectionsQueryResult {
  connections: Connection[]
  totalCount: number
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
  closeConnection: (connection: Connection, reason: string) => Promise<void>
}

export function useConnections(
  options: ConnectionsQueryOptions
): ConnectionsQueryResult {
  const { user } = useAuth()
  const [result, setResult] = useState<{
    key: string
    page: ConnectionsPage
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

    fetchConnections(
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

  const closeConnection = useCallback(
    async (connection: Connection, reason: string) => {
      if (!token) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await closeConnectionRequest(token, connection.name, reason)
      setRefreshId((current) => current + 1)
    },
    [token]
  )

  const requestError = failure?.key === requestKey ? failure.message : null
  const currentPage = requestError ? EMPTY_PAGE : (result?.page ?? EMPTY_PAGE)
  const hasSession = Boolean(token)

  return {
    connections: currentPage.items,
    totalCount: currentPage.totalCount,
    filteredCount: currentPage.filteredCount,
    pageCount: currentPage.pageCount,
    loading: hasSession && !requestError && result?.key !== requestKey,
    error: hasSession
      ? requestError
      : "Your session has expired. Sign in again.",
    retry,
    closeConnection,
  }
}
