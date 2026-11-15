import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import type {
  HistoryPoint,
  Policy,
  RangeKey,
  ClusterSnapshot,
} from "@/data/types"
import { ApiError } from "@/lib/api"
import {
  historyFromSamples,
  trendFromSamples,
  type ClusterTotals,
  type HistorySample,
} from "@/lib/format"
import * as rabbit from "@/lib/rabbit-api"
import { useAuth } from "@/store/auth"

const DEFAULT_REFRESH_SECONDS = 5
const SAMPLE_RETENTION_MS = 24 * 60 * 60 * 1000

export type RefreshInterval = 5 | 15 | 30
export const REFRESH_INTERVALS: RefreshInterval[] = [5, 15, 30]

const EMPTY_TOTALS: ClusterTotals = {
  queues: 0,
  exchanges: 0,
  connections: 0,
  channels: 0,
  consumers: 0,
  ready: 0,
  unacked: 0,
  publishRate: 0,
  deliverRate: 0,
  ackRate: 0,
  connectionCreatedRate: 0,
  connectionClosedRate: 0,
  channelCreatedRate: 0,
  channelClosedRate: 0,
  queueCreatedRate: 0,
  queueDeletedRate: 0,
  queueDeclaredRate: 0,
}

function emptyData(): ClusterSnapshot {
  return {
    cluster: {
      name: "RabbitMQ",
      node: "",
      version: "",
      erlang: "",
      startedAt: new Date().getTime(),
      trends: {
        ready: 0,
        unacked: 0,
        consumers: 0,
        connections: 0,
        queues: 0,
        exchanges: 0,
      },
    },
    nodes: [],
    ports: [],
    webContexts: [],
    vhosts: [],
    queues: [],
    exchanges: [],
    bindings: [],
    consumers: [],
    connections: [],
    channels: [],
    users: [],
    policies: [],
    operatorPolicies: [],
    limits: [],
    flags: [],
    deprecatedFeatures: [],
  }
}

interface ClusterState {
  data: ClusterSnapshot
  totals: ClusterTotals
  samples: HistorySample[]
  refreshInterval: RefreshInterval
  status: "loading" | "ready"
  error: string | null
  lastUpdated: number
}

type Action =
  | { type: "loaded"; snapshot: rabbit.RabbitSnapshot; time: number }
  | { type: "failed"; message: string }
  | { type: "refresh" }
  | { type: "set-refresh-interval"; value: RefreshInterval }

function trendsFrom(
  samples: HistorySample[],
  totals: ClusterTotals,
  time: number
) {
  return {
    ready: trendFromSamples(samples, totals, time, "ready"),
    unacked: trendFromSamples(samples, totals, time, "unacked"),
    consumers: trendFromSamples(samples, totals, time, "consumers"),
    connections: trendFromSamples(samples, totals, time, "connections"),
    queues: trendFromSamples(samples, totals, time, "queues"),
    exchanges: trendFromSamples(samples, totals, time, "exchanges"),
  }
}

function reducer(state: ClusterState, action: Action): ClusterState {
  switch (action.type) {
    case "loaded": {
      const { snapshot, time } = action
      const samples = [
        ...state.samples,
        { at: time, totals: snapshot.totals },
      ].filter((sample) => time - sample.at <= SAMPLE_RETENTION_MS)
      return {
        ...state,
        data: {
          ...snapshot,
          cluster: {
            ...snapshot.cluster,
            trends: trendsFrom(samples, snapshot.totals, time),
          },
        },
        totals: snapshot.totals,
        samples,
        status: "ready",
        error: null,
        lastUpdated: time,
      }
    }
    case "failed":
      return { ...state, status: "ready", error: action.message }
    case "refresh":
      return { ...state, status: "loading", error: null }
    case "set-refresh-interval":
      return { ...state, refreshInterval: action.value }
    default:
      return state
  }
}

function createInitialState(): ClusterState {
  return {
    data: emptyData(),
    totals: EMPTY_TOTALS,
    samples: [],
    refreshInterval: DEFAULT_REFRESH_SECONDS,
    status: "loading",
    error: null,
    lastUpdated: new Date().getTime(),
  }
}

export interface LimitInput {
  vhost: string
  maxConnections: number
  maxQueues: number
}

export interface ClusterActions {
  setRefreshInterval: (value: RefreshInterval) => void
  refresh: () => void
  retry: () => void
  purgeQueue: (vhost: string, name: string) => Promise<void>
  deleteQueue: (vhost: string, name: string) => Promise<void>
  addQueue: (input: rabbit.CreateQueueInput) => Promise<void>
  publish: (input: rabbit.PublishInput) => Promise<boolean>
  addExchange: (input: rabbit.CreateExchangeInput) => Promise<void>
  deleteExchange: (vhost: string, name: string) => Promise<void>
  addBinding: (input: rabbit.CreateBindingInput) => Promise<void>
  deleteBinding: (input: rabbit.DeleteBindingInput) => Promise<void>
  closeChannel: (name: string) => Promise<void>
  addUser: (input: rabbit.CreateUserInput) => Promise<void>
  deleteUser: (username: string) => Promise<void>
  addVhost: (input: rabbit.CreateVhostInput) => Promise<void>
  deleteVhost: (name: string) => Promise<void>
  addPolicy: (policy: Policy, operator?: boolean) => Promise<void>
  deletePolicy: (
    vhost: string,
    name: string,
    operator?: boolean
  ) => Promise<void>
  updateLimit: (input: LimitInput) => Promise<void>
  toggleFlag: (name: string, enabled: boolean) => Promise<void>
  importDefinitions: (file: File, overwrite: boolean) => Promise<void>
}

interface ClusterContextValue extends ClusterState {
  history: Record<RangeKey, HistoryPoint[]>
  actions: ClusterActions
  revision: number
}

const ClusterContext = createContext<ClusterContextValue | null>(null)

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const { user } = useAuth()
  const token = user?.token ?? null
  const [refreshNonce, setRefreshNonce] = useState(0)

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      try {
        const snapshot = await rabbit.fetchRabbitSnapshot(
          token,
          controller.signal
        )
        if (!cancelled) {
          dispatch({
            type: "loaded",
            snapshot,
            time: new Date().getTime(),
          })
        }
      } catch (error) {
        if (cancelled || controller.signal.aborted) return
        dispatch({
          type: "failed",
          message:
            error instanceof ApiError
              ? error.message
              : "Cannot reach the RabbitMQ management API.",
        })
      }
    }

    void load()
    const timer = window.setInterval(
      () => void load(),
      state.refreshInterval * 1000
    )
    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(timer)
    }
  }, [token, state.refreshInterval, refreshNonce])

  const history = useMemo(
    () => historyFromSamples(state.samples, state.lastUpdated),
    [state.samples, state.lastUpdated]
  )

  const run = useCallback(
    async <T,>(request: (token: string) => Promise<T>): Promise<T> => {
      if (!token) throw new Error("Your session has expired. Sign in again.")
      const result = await request(token)
      setRefreshNonce((value) => value + 1)
      return result
    },
    [token]
  )

  const actions = useMemo<ClusterActions>(
    () => ({
      setRefreshInterval: (value) =>
        dispatch({ type: "set-refresh-interval", value }),
      refresh: () => {
        dispatch({ type: "refresh" })
        setRefreshNonce((value) => value + 1)
      },
      retry: () => {
        dispatch({ type: "refresh" })
        setRefreshNonce((value) => value + 1)
      },
      purgeQueue: (vhost, name) =>
        run((current) => rabbit.purgeQueue(current, vhost, name)),
      deleteQueue: (vhost, name) =>
        run((current) => rabbit.deleteQueue(current, vhost, name)),
      addQueue: (input) => run((current) => rabbit.createQueue(current, input)),
      publish: (input) =>
        run((current) => rabbit.publishMessage(current, input)),
      addExchange: (input) =>
        run((current) => rabbit.createExchange(current, input)),
      deleteExchange: (vhost, name) =>
        run((current) => rabbit.deleteExchange(current, vhost, name)),
      addBinding: (input) =>
        run((current) => rabbit.createBinding(current, input)),
      deleteBinding: (input) =>
        run((current) => rabbit.deleteBinding(current, input)),
      closeChannel: (name) =>
        run((current) => rabbit.closeChannel(current, name)),
      addUser: (input) => run((current) => rabbit.createUser(current, input)),
      deleteUser: (username) =>
        run((current) => rabbit.deleteUser(current, username)),
      addVhost: (input) => run((current) => rabbit.createVhost(current, input)),
      deleteVhost: (name) =>
        run((current) => rabbit.deleteVhost(current, name)),
      addPolicy: (policy, operator = false) =>
        run((current) => rabbit.savePolicy(current, policy, operator)),
      deletePolicy: (vhost, name, operator = false) =>
        run((current) => rabbit.deletePolicy(current, vhost, name, operator)),
      updateLimit: (input) =>
        run((current) =>
          rabbit.updateVhostLimits(
            current,
            input.vhost,
            input.maxConnections,
            input.maxQueues
          )
        ),
      toggleFlag: (name, enabled) =>
        run((current) => rabbit.setFeatureFlag(current, name, enabled)),
      importDefinitions: (file, overwrite) =>
        run((current) => rabbit.uploadDefinitions(current, file, overwrite)),
    }),
    [run]
  )

  const value = useMemo(
    () => ({ ...state, history, actions, revision: refreshNonce }),
    [state, history, actions, refreshNonce]
  )

  return (
    <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>
  )
}

export function useCluster(): ClusterContextValue {
  const context = useContext(ClusterContext)
  if (!context)
    throw new Error("useCluster must be used inside ClusterProvider")
  return context
}
