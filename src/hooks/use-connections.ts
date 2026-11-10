import { useCallback, useEffect, useMemo, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { Connection } from "@/data/types"
import { IS_DEMO } from "@/lib/env"
import { closeConnection as closeConnectionRequest, fetchConnections, type ConnectionsPage } from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

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

const SORT_VALUES: Record<string, (connection: Connection) => string | number> =
  {
    name: (connection) => connection.userProvidedName ?? connection.name,
    user: (connection) => connection.user,
    vhost: (connection) => connection.vhost,
    state: (connection) => connection.state,
    node: (connection) => connection.node,
    protocol: (connection) => connection.protocol,
    channels: (connection) => connection.channels,
    recvRate: (connection) => connection.recvRate,
    sendRate: (connection) => connection.sendRate,
    connectedAt: (connection) => connection.connectedAt,
    client: (connection) => connection.client,
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

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

function demoPage(
  connections: Connection[],
  options: ConnectionsQueryOptions
): ConnectionsPage {
  const term = options.search.trim().toLowerCase()
  const filtered = connections.filter(
    (connection) =>
      (!term || connection.name.toLowerCase().includes(term)) &&
      (!options.vhost || connection.vhost === options.vhost)
  )

  const sort = options.sorting[0]
  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const accessor = SORT_VALUES[sort.id]
        if (!accessor) return 0
        const result = compareValues(accessor(a), accessor(b))
        return sort.desc ? -result : result
      })
    : filtered

  const pageCount = Math.max(
    1,
    Math.ceil(sorted.length / options.pageSize)
  )
  const pageIndex = Math.min(options.pageIndex, pageCount - 1)

  return {
    items: sorted.slice(
      pageIndex * options.pageSize,
      (pageIndex + 1) * options.pageSize
    ),
    totalCount: connections.length,
    filteredCount: sorted.length,
    page: pageIndex + 1,
    pageSize: options.pageSize,
    pageCount,
  }
}

export function useConnections(
  options: ConnectionsQueryOptions
): ConnectionsQueryResult {
  const { data, status, error: clusterError, actions } = useCluster()
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
    if (IS_DEMO || !token) return undefined

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

  const localPage = useMemo(
    () => demoPage(data.connections, options),
    [data.connections, options]
  )

  const retry = useCallback(() => {
    if (IS_DEMO) {
      actions.retry()
      return
    }
    setRefreshId((current) => current + 1)
  }, [actions])

  const closeConnection = useCallback(
    async (connection: Connection, reason: string) => {
      if (IS_DEMO) {
        actions.closeConnection(connection.id)
        return
      }
      if (!token) {
        throw new Error("Your session has expired. Sign in again.")
      }
      await closeConnectionRequest(token, connection.name, reason)
      setRefreshId((current) => current + 1)
    },
    [actions, token]
  )

  if (IS_DEMO) {
    return {
      connections: localPage.items,
      totalCount: localPage.totalCount,
      filteredCount: localPage.filteredCount,
      pageCount: localPage.pageCount,
      loading: status === "loading",
      error: clusterError,
      retry,
      closeConnection,
    }
  }

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
