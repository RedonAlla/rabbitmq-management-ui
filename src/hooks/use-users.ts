import { useCallback, useEffect, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import type { User } from "@/data/types"
import { fetchUsers, type UsersPage } from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

const SORT_FIELDS: Record<string, string> = {
  username: "name",
}

const EMPTY_PAGE: UsersPage = {
  items: [],
  totalCount: 0,
  filteredCount: 0,
  page: 1,
  pageSize: 100,
  pageCount: 0,
}

interface UsersQueryOptions {
  pageIndex: number
  pageSize: number
  search: string
  username?: string
  sorting: SortingState
}

interface UsersQueryResult {
  users: User[]
  totalCount: number
  filteredCount: number
  pageCount: number
  loading: boolean
  error: string | null
  retry: () => void
}

export function useUsers(options: UsersQueryOptions): UsersQueryResult {
  const { user } = useAuth()
  const { revision } = useCluster()
  const [result, setResult] = useState<{
    key: string
    page: UsersPage
  } | null>(null)
  const [failure, setFailure] = useState<{
    key: string
    message: string
  } | null>(null)
  const [refreshId, setRefreshId] = useState(0)

  const { pageIndex, pageSize, search, username, sorting } = options
  const sort = sorting[0]
  const sortField = sort ? SORT_FIELDS[sort.id] : undefined
  const sortReverse = sort?.desc ?? false
  const token = user?.token
  const requestKey = [
    pageIndex,
    pageSize,
    search,
    username ?? "",
    sortField ?? "",
    sortReverse,
    refreshId,
    revision,
  ].join("|")

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    fetchUsers(
      token,
      {
        page: pageIndex + 1,
        pageSize,
        name: username ?? search,
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
    username,
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
    users: currentPage.items,
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
