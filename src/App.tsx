import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { useRoute } from "@/lib/router"
import { useCluster } from "@/store/cluster"
import { OverviewView } from "@/views/overview"
import { QueuesView } from "@/views/queues"
import { QueueDetailView } from "@/views/queue-detail"
import { ExchangesView } from "@/views/exchanges"
import { ExchangeDetailView } from "@/views/exchange-detail"
import { ConnectionsView } from "@/views/connections"
import { ConnectionDetailView } from "@/views/connection-detail"
import { ChannelsView } from "@/views/channels"
import { ChannelDetailView } from "@/views/channel-detail"
import { UsersView } from "@/views/users"
import { UserDetailView } from "@/views/user-detail"
import { VhostsView } from "@/views/vhosts"
import { PoliciesView } from "@/views/policies"
import { LimitsView } from "@/views/limits"
import { FlagsView } from "@/views/flags"
import { DeprecatedFeaturesView } from "@/views/deprecated"
import { ClusterView } from "@/views/cluster"
import { DefinitionsView } from "@/views/definitions"
import { LoginView } from "@/views/login"
import { NotFoundView } from "@/views/not-found"
import { useAuth } from "@/store/auth"

const VIEW_TITLES: Record<string, string> = {
  overview: "Overview",
  queues: "Queues",
  queue: "Queue",
  exchanges: "Exchanges",
  exchange: "Exchange",
  connections: "Connections",
  connection: "Connection",
  channels: "Channels",
  channel: "Channel",
  users: "Users",
  user: "User",
  vhosts: "Virtual hosts",
  policies: "Policies",
  limits: "Limits",
  flags: "Feature flags",
  deprecated: "Deprecated features",
  cluster: "Cluster",
  definitions: "Import / export definitions",
}

function RoutedView() {
  const { route } = useRoute()

  switch (route.view) {
    case "overview":
      return <OverviewView />
    case "queues":
      return <QueuesView />
    case "queue":
      return <QueueDetailView />
    case "exchanges":
      return <ExchangesView />
    case "exchange":
      return <ExchangeDetailView />
    case "connections":
      return <ConnectionsView />
    case "connection":
      return <ConnectionDetailView />
    case "channels":
      return <ChannelsView />
    case "channel":
      return <ChannelDetailView />
    case "users":
      return <UsersView />
    case "user":
      return <UserDetailView />
    case "vhosts":
      return <VhostsView />
    case "policies":
      return <PoliciesView />
    case "limits":
      return <LimitsView />
    case "flags":
      return <FlagsView />
    case "deprecated":
      return <DeprecatedFeaturesView />
    case "cluster":
      return <ClusterView />
    case "definitions":
      return <DefinitionsView />
    default:
      return <NotFoundView />
  }
}

export function App() {
  const { route } = useRoute()
  const { data } = useCluster()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      document.title = "Sign in · RabbitMQ Management"
      return
    }
    const page = VIEW_TITLES[route.view] ?? "Not found"
    document.title = `${page} · ${data.cluster.name} · RabbitMQ Management`
  }, [route.view, data.cluster.name, user])

  return (
    <>
      {user ? (
        <AppShell>
          <RoutedView />
        </AppShell>
      ) : (
        <LoginView />
      )}
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
