import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { SEED_NOW, seedData } from "@/data/seed";
import type {
  Channel,
  ClusterEvent,
  Exchange,
  FeatureFlag,
  HistoryPoint,
  Policy,
  Queue,
  RangeKey,
  SeedData,
  User,
  Vhost,
  VhostLimit,
} from "@/data/types";
import {
  buildAllHistory,
  getTotals,
  hashStr,
  mulberry32,
  tickHistory,
  type ClusterTotals,
} from "@/lib/format";
import type { EventTone } from "@/data/types";
import {
  applyDefinitions,
  type BrokerDefinitions,
} from "@/lib/definitions";

function nowMs(): number {
  return new Date().getTime();
}

function shiftSeed(offset: number): SeedData {
  return {
    ...seedData,
    cluster: { ...seedData.cluster, startedAt: seedData.cluster.startedAt + offset },
    queues: seedData.queues.map((queue) => ({ ...queue, created: queue.created + offset })),
    consumers: seedData.consumers.map((consumer) => ({ ...consumer, since: consumer.since + offset })),
    connections: seedData.connections.map((connection) => ({
      ...connection,
      connectedAt: connection.connectedAt + offset,
    })),
    events: seedData.events.map((event) => ({ ...event, time: event.time + offset })),
  };
}

interface ClusterState {
  data: SeedData;
  totals: ClusterTotals;
  history: Record<RangeKey, HistoryPoint[]>;
  live: boolean;
  status: "loading" | "ready";
  error: string | null;
  lastUpdated: number;
  tick: number;
  eventSeq: number;
}

type Action =
  | { type: "tick"; time: number }
  | { type: "set-live"; value: boolean }
  | { type: "refresh" }
  | { type: "loaded"; time: number }
  | { type: "fail"; message: string }
  | { type: "retry" }
  | { type: "log"; tone: EventTone; title: string; detail: string; time: number }
  | { type: "purge-queue"; name: string; time: number }
  | { type: "delete-queue"; name: string; time: number }
  | { type: "add-queue"; queue: Queue; time: number }
  | { type: "publish"; exchange: string; vhost: string; routingKey: string; targets: string[]; count: number; time: number }
  | { type: "add-exchange"; exchange: Exchange; time: number }
  | { type: "delete-exchange"; name: string; time: number }
  | { type: "close-connection"; id: string; time: number }
  | { type: "close-channel"; id: string; time: number }
  | { type: "add-user"; user: User; time: number }
  | { type: "delete-user"; username: string; time: number }
  | { type: "add-vhost"; vhost: Vhost; time: number }
  | { type: "delete-vhost"; name: string; time: number }
  | { type: "add-policy"; policy: Policy; time: number }
  | { type: "delete-policy"; name: string; time: number }
  | { type: "add-operator-policy"; policy: Policy; time: number }
  | { type: "delete-operator-policy"; name: string; time: number }
  | { type: "rename-cluster"; name: string; time: number }
  | { type: "update-limit"; limit: VhostLimit; time: number }
  | { type: "toggle-flag"; name: string; time: number }
  | {
      type: "import-definitions";
      definitions: BrokerDefinitions;
      overwrite: boolean;
      time: number;
    };

function eventFor(
  state: ClusterState,
  tone: EventTone,
  title: string,
  detail: string,
  time: number,
  data: SeedData
): { data: SeedData; eventSeq: number } {
  const event: ClusterEvent = {
    id: `event-${state.eventSeq + 1}`,
    type: tone,
    title,
    detail,
    time,
  };
  return {
    data: { ...data, events: [event, ...data.events].slice(0, 30) },
    eventSeq: state.eventSeq + 1,
  };
}

function recalcQueueConsumers(queues: Queue[], consumers: SeedData["consumers"]): Queue[] {
  const counts = new Map<string, number>();
  for (const consumer of consumers) {
    counts.set(consumer.queue, (counts.get(consumer.queue) ?? 0) + 1);
  }
  return queues.map((queue) => ({ ...queue, consumers: counts.get(queue.name) ?? 0 }));
}

function recalcChannelConsumers(channels: Channel[], consumers: SeedData["consumers"]): Channel[] {
  const counts = new Map<string, number>();
  for (const consumer of consumers) {
    counts.set(consumer.channel, (counts.get(consumer.channel) ?? 0) + 1);
  }
  return channels.map((channel) => ({ ...channel, consumers: counts.get(channel.id) ?? 0 }));
}

function mutate(state: ClusterState, patch: Partial<SeedData>): SeedData {
  return { ...state.data, ...patch };
}

function reducer(state: ClusterState, action: Action): ClusterState {
  switch (action.type) {
    case "tick": {
      if (!state.live) return state;
      const tick = state.tick + 1;
      const random = mulberry32(hashStr(`tick:${tick}`));

      const queues = state.data.queues.map((queue) => {
        const drift = (random() - 0.5) * 0.07;
        const publishRate = Math.max(0, queue.publishRate * (1 + drift));
        const deliverRate = Math.max(0, queue.deliverRate * (1 + drift * 0.8));
        const net = (publishRate - deliverRate) * 2.5;
        const jitter = (random() - 0.5) * 4;
        const ready = Math.max(0, Math.round(queue.ready + net + jitter));
        const unacked = Math.max(0, Math.round(queue.unacked + (random() - 0.5) * 2));
        const nextState: Queue["state"] =
          queue.consumers === 0 && deliverRate < 0.05
            ? "idle"
            : ready > 5000
              ? "degraded"
              : "running";
        return {
          ...queue,
          ready,
          unacked,
          publishRate,
          deliverRate,
          ackRate: Math.max(0, queue.ackRate * (1 + drift * 0.7)),
          state: nextState,
        };
      });

      const exchanges = state.data.exchanges.map((exchange) => ({
        ...exchange,
        publishRate: Math.max(0, exchange.publishRate * (1 + (random() - 0.5) * 0.05)),
        deliverRate: Math.max(0, exchange.deliverRate * (1 + (random() - 0.5) * 0.05)),
      }));

      const connections = state.data.connections.map((connection) => ({
        ...connection,
        recvRate: Math.max(0, connection.recvRate * (1 + (random() - 0.5) * 0.12)),
        sendRate: Math.max(0, connection.sendRate * (1 + (random() - 0.5) * 0.12)),
      }));

      const channels = state.data.channels.map((channel) => ({
        ...channel,
        publishRate: Math.max(0, channel.publishRate * (1 + (random() - 0.5) * 0.1)),
        deliverRate: Math.max(0, channel.deliverRate * (1 + (random() - 0.5) * 0.1)),
        unacked: Math.max(0, Math.round(channel.unacked + (random() - 0.5) * 2)),
      }));

      const nodes = state.data.nodes.map((node) => ({
        ...node,
        cpu: Math.min(95, Math.max(2, node.cpu + (random() - 0.5) * 4)),
        memory: Math.min(node.memoryMax, Math.max(0.4, node.memory + (random() - 0.5) * 0.05)),
      }));

      const data = { ...state.data, queues, exchanges, connections, channels, nodes };
      const totals = getTotals(data);
      return {
        ...state,
        data,
        totals,
        history: tickHistory(state.history, totals, tick),
        tick,
        lastUpdated: action.time,
      };
    }
    case "set-live":
      return { ...state, live: action.value };
    case "refresh":
      return { ...state, status: "loading", error: null };
    case "loaded":
      return { ...state, status: "ready", error: null, lastUpdated: action.time };
    case "fail":
      return { ...state, status: "ready", error: action.message };
    case "retry":
      return { ...state, status: "loading", error: null };
    case "log": {
      const recorded = eventFor(state, action.tone, action.title, action.detail, action.time, state.data);
      return {
        ...state,
        data: recorded.data,
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "purge-queue": {
      const queues = state.data.queues.map((queue) =>
        queue.name === action.name ? { ...queue, ready: 0 } : queue
      );
      const data = mutate(state, { queues });
      const recorded = eventFor(
        state,
        "warn",
        "Queue purged",
        `${action.name} was purged by admin`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "delete-queue": {
      const queues = state.data.queues.filter((queue) => queue.name !== action.name);
      const bindings = state.data.bindings.filter((binding) => binding.destination !== action.name);
      const consumers = state.data.consumers.filter((consumer) => consumer.queue !== action.name);
      const nextQueues = recalcQueueConsumers(queues, consumers);
      const channels = recalcChannelConsumers(state.data.channels, consumers);
      const data = mutate(state, { queues: nextQueues, bindings, consumers, channels });
      const recorded = eventFor(
        state,
        "warn",
        "Queue deleted",
        `${action.name} and its bindings were removed`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "add-queue": {
      const data = mutate(state, {
        queues: [...state.data.queues, action.queue],
      });
      const recorded = eventFor(
        state,
        "ok",
        "Queue created",
        `${action.queue.name} declared on vhost ${action.queue.vhost}`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "publish": {
      const perTarget = action.targets.length ? Math.ceil(action.count / action.targets.length) : 0;
      const queues = state.data.queues.map((queue) =>
        action.targets.includes(queue.name)
          ? {
              ...queue,
              ready: queue.ready + perTarget,
              publishRate: queue.publishRate + perTarget / 10,
            }
          : queue
      );
      const exchanges = state.data.exchanges.map((exchange) =>
        exchange.name === action.exchange && exchange.vhost === action.vhost
          ? {
              ...exchange,
              publishRate: exchange.publishRate + action.count / 10,
              deliverRate: exchange.deliverRate + action.count / 10,
            }
          : exchange
      );
      const data = mutate(state, { queues, exchanges });
      const recorded = eventFor(
        state,
        "info",
        "Messages published",
        `${action.count} messages published to ${action.exchange || "(default exchange)"} → ${action.routingKey || "(no key)"}`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "add-exchange": {
      const data = mutate(state, {
        exchanges: [...state.data.exchanges, action.exchange],
      });
      const recorded = eventFor(
        state,
        "ok",
        "Exchange created",
        `${action.exchange.name} (${action.exchange.type}) declared on ${action.exchange.vhost}`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "delete-exchange": {
      const exchanges = state.data.exchanges.filter((exchange) => exchange.name !== action.name);
      const bindings = state.data.bindings.filter((binding) => binding.source !== action.name);
      const data = mutate(state, { exchanges, bindings });
      const recorded = eventFor(
        state,
        "warn",
        "Exchange deleted",
        `${action.name} and its bindings were removed`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "close-connection": {
      const connection = state.data.connections.find((entry) => entry.id === action.id);
      const connections = state.data.connections.filter((entry) => entry.id !== action.id);
      const channels = state.data.channels.filter((channel) => channel.connection !== action.id);
      const consumers = state.data.consumers.filter((consumer) => consumer.connection !== action.id);
      const queues = recalcQueueConsumers(state.data.queues, consumers);
      const data = mutate(state, { connections, channels, consumers, queues });
      const recorded = eventFor(
        state,
        "warn",
        "Connection closed",
        `${connection?.name ?? action.id} was closed by admin`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "close-channel": {
      const channel = state.data.channels.find((entry) => entry.id === action.id);
      const channels = state.data.channels.filter((entry) => entry.id !== action.id);
      const consumers = state.data.consumers.filter((consumer) => consumer.channel !== action.id);
      const queues = recalcQueueConsumers(state.data.queues, consumers);
      const connections = state.data.connections.map((connection) =>
        connection.id === channel?.connection
          ? { ...connection, channels: Math.max(0, connection.channels - 1) }
          : connection
      );
      const data = mutate(state, { channels, consumers, queues, connections });
      const recorded = eventFor(
        state,
        "warn",
        "Channel closed",
        `Channel ${action.id} was closed by admin`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "add-user": {
      const data = mutate(state, {
        users: [...state.data.users, action.user],
      });
      const recorded = eventFor(
        state,
        "ok",
        "User created",
        `${action.user.username} was granted ${action.user.tags.join(", ") || "no tags"}`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "delete-user": {
      const data = mutate(state, {
        users: state.data.users.filter((user) => user.username !== action.username),
      });
      const recorded = eventFor(
        state,
        "warn",
        "User deleted",
        `${action.username} was removed from the cluster`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "add-vhost": {
      const data = mutate(state, {
        vhosts: [...state.data.vhosts, action.vhost],
      });
      const recorded = eventFor(
        state,
        "ok",
        "Virtual host created",
        `${action.vhost.name} is ready for topology`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "delete-vhost": {
      const used =
        state.data.queues.some((queue) => queue.vhost === action.name) ||
        state.data.connections.some((connection) => connection.vhost === action.name) ||
        state.data.exchanges.some((exchange) => exchange.vhost === action.name);
      if (used) {
        const recorded = eventFor(
          state,
          "error",
          "Virtual host is not empty",
          `${action.name} still owns queues, exchanges or connections`,
          action.time,
          state.data
        );
        return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
      }
      const data = mutate(state, {
        vhosts: state.data.vhosts.filter((vhost) => vhost.name !== action.name),
        limits: state.data.limits.filter((limit) => limit.vhost !== action.name),
        policies: state.data.policies.filter((policy) => policy.vhost !== action.name),
      });
      const recorded = eventFor(
        state,
        "warn",
        "Virtual host deleted",
        `${action.name} was removed`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "add-policy": {
      const data = mutate(state, {
        policies: [...state.data.policies, action.policy],
      });
      const recorded = eventFor(
        state,
        "ok",
        "Policy created",
        `${action.policy.name} applies to ${action.policy.applyTo} on ${action.policy.vhost}`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "delete-policy": {
      const data = mutate(state, {
        policies: state.data.policies.filter((policy) => policy.name !== action.name),
        queues: state.data.queues.map((queue) =>
          queue.policy === action.name ? { ...queue, policy: null } : queue
        ),
      });
      const recorded = eventFor(
        state,
        "warn",
        "Policy deleted",
        `${action.name} no longer applies to any queue`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "add-operator-policy": {
      const data = mutate(state, {
        operatorPolicies: [...state.data.operatorPolicies, action.policy],
      });
      const recorded = eventFor(
        state,
        "ok",
        "Operator policy created",
        `${action.policy.name} applies to ${action.policy.applyTo} on ${action.policy.vhost}`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "delete-operator-policy": {
      const data = mutate(state, {
        operatorPolicies: state.data.operatorPolicies.filter(
          (policy) => policy.name !== action.name
        ),
      });
      const recorded = eventFor(
        state,
        "warn",
        "Operator policy deleted",
        `${action.name} no longer overrides user policies`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "rename-cluster": {
      const data = {
        ...state.data,
        cluster: { ...state.data.cluster, name: action.name },
      };
      const recorded = eventFor(
        state,
        "ok",
        "Cluster renamed",
        `The cluster is now known as ${action.name}`,
        action.time,
        data
      );
      return {
        ...state,
        data: recorded.data,
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    case "update-limit": {
      const exists = state.data.limits.some((limit) => limit.vhost === action.limit.vhost);
      const limits = exists
        ? state.data.limits.map((limit) =>
            limit.vhost === action.limit.vhost ? action.limit : limit
          )
        : [...state.data.limits, action.limit];
      const data = mutate(state, { limits });
      const recorded = eventFor(
        state,
        "info",
        "Vhost limits updated",
        `${action.limit.vhost}: ${action.limit.maxConnections} connections, ${action.limit.maxQueues} queues`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "toggle-flag": {
      const flags: FeatureFlag[] = state.data.flags.map((flag) =>
        flag.name === action.name ? { ...flag, enabled: !flag.enabled } : flag
      );
      const flag = flags.find((entry) => entry.name === action.name);
      const data = mutate(state, { flags });
      const recorded = eventFor(
        state,
        flag?.enabled ? "ok" : "warn",
        flag?.enabled ? "Feature flag enabled" : "Feature flag disabled",
        `${action.name} is now ${flag?.enabled ? "enabled" : "disabled"}`,
        action.time,
        data
      );
      return { ...state, data: recorded.data, eventSeq: recorded.eventSeq };
    }
    case "import-definitions": {
      const applied = applyDefinitions(state.data, action.definitions, action.overwrite);
      const recorded = eventFor(
        state,
        "ok",
        "Definitions imported",
        `${applied.imported} definitions applied${applied.skipped ? `, ${applied.skipped} skipped` : ""}${action.overwrite ? " with overwrite" : ""}`,
        action.time,
        applied.data
      );
      return {
        ...state,
        data: recorded.data,
        totals: getTotals(recorded.data),
        eventSeq: recorded.eventSeq,
        lastUpdated: action.time,
      };
    }
    default:
      return state;
  }
}

function createInitialState(): ClusterState {
  const data = shiftSeed(nowMs() - SEED_NOW);
  const totals = getTotals(data);
  return {
    data,
    totals,
    history: buildAllHistory(totals),
    live: true,
    status: "loading",
    error: null,
    lastUpdated: nowMs(),
    tick: 0,
    eventSeq: 0,
  };
}

interface ClusterContextValue extends ClusterState {
  actions: {
    setLive: (value: boolean) => void;
    refresh: () => void;
    simulateError: () => void;
    retry: () => void;
    log: (tone: EventTone, title: string, detail: string) => void;
    purgeQueue: (name: string) => void;
    deleteQueue: (name: string) => void;
    addQueue: (queue: Queue) => void;
    publish: (input: { exchange: string; vhost: string; routingKey: string; targets: string[]; count: number }) => void;
    addExchange: (exchange: Exchange) => void;
    deleteExchange: (name: string) => void;
    closeConnection: (id: string) => void;
    closeChannel: (id: string) => void;
    addUser: (user: User) => void;
    deleteUser: (username: string) => void;
    addVhost: (vhost: Vhost) => void;
    deleteVhost: (name: string) => void;
    addPolicy: (policy: Policy) => void;
    deletePolicy: (name: string) => void;
    addOperatorPolicy: (policy: Policy) => void;
    deleteOperatorPolicy: (name: string) => void;
    renameCluster: (name: string) => void;
    updateLimit: (limit: VhostLimit) => void;
    toggleFlag: (name: string) => void;
    importDefinitions: (definitions: BrokerDefinitions, overwrite: boolean) => void;
  };
}

const ClusterContext = createContext<ClusterContextValue | null>(null);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    if (state.status !== "loading") return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "loaded", time: nowMs() }), 600);
    return () => window.clearTimeout(timer);
  }, [state.status]);

  useEffect(() => {
    if (!state.live) return undefined;
    const timer = window.setInterval(() => dispatch({ type: "tick", time: nowMs() }), 2500);
    return () => window.clearInterval(timer);
  }, [state.live]);

  const actions = useMemo<ClusterContextValue["actions"]>(
    () => ({
      setLive: (value) => dispatch({ type: "set-live", value }),
      refresh: () => dispatch({ type: "refresh" }),
      simulateError: () =>
        dispatch({ type: "fail", message: "The management API did not respond. Showing the last known snapshot." }),
      retry: () => dispatch({ type: "retry" }),
      log: (tone, title, detail) =>
        dispatch({ type: "log", tone, title, detail, time: nowMs() }),
      purgeQueue: (name) => dispatch({ type: "purge-queue", name, time: nowMs() }),
      deleteQueue: (name) => dispatch({ type: "delete-queue", name, time: nowMs() }),
      addQueue: (queue) => dispatch({ type: "add-queue", queue, time: nowMs() }),
      publish: (input) => dispatch({ type: "publish", ...input, time: nowMs() }),
      addExchange: (exchange) => dispatch({ type: "add-exchange", exchange, time: nowMs() }),
      deleteExchange: (name) => dispatch({ type: "delete-exchange", name, time: nowMs() }),
      closeConnection: (id) => dispatch({ type: "close-connection", id, time: nowMs() }),
      closeChannel: (id) => dispatch({ type: "close-channel", id, time: nowMs() }),
      addUser: (user) => dispatch({ type: "add-user", user, time: nowMs() }),
      deleteUser: (username) => dispatch({ type: "delete-user", username, time: nowMs() }),
      addVhost: (vhost) => dispatch({ type: "add-vhost", vhost, time: nowMs() }),
      deleteVhost: (name) => dispatch({ type: "delete-vhost", name, time: nowMs() }),
      addPolicy: (policy) => dispatch({ type: "add-policy", policy, time: nowMs() }),
      deletePolicy: (name) => dispatch({ type: "delete-policy", name, time: nowMs() }),
      addOperatorPolicy: (policy) =>
        dispatch({ type: "add-operator-policy", policy, time: nowMs() }),
      deleteOperatorPolicy: (name) =>
        dispatch({ type: "delete-operator-policy", name, time: nowMs() }),
      renameCluster: (name) => dispatch({ type: "rename-cluster", name, time: nowMs() }),
      updateLimit: (limit) => dispatch({ type: "update-limit", limit, time: nowMs() }),
      toggleFlag: (name) => dispatch({ type: "toggle-flag", name, time: nowMs() }),
      importDefinitions: (definitions, overwrite) =>
        dispatch({ type: "import-definitions", definitions, overwrite, time: nowMs() }),
    }),
    []
  );

  const value = useMemo(() => ({ ...state, actions }), [state, actions]);

  return <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>;
}

export function useCluster(): ClusterContextValue {
  const context = useContext(ClusterContext);
  if (!context) throw new Error("useCluster must be used inside ClusterProvider");
  return context;
}
