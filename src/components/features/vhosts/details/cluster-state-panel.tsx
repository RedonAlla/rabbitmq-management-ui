import { Badge } from "@/components/reui/badge"
import { FactPanel, type Fact } from "@/components/detail"
import { Case, Default, Switch } from "@/components/conditional-render"

function nodeStateBadge(value: string) {
  return (
    <Switch condition={value}>
    <Case value={"running"}>
      <Badge variant="success-light">Running</Badge>
    </Case>
    <Case value={"stopped"}>
      <Badge variant="destructive-light">Stopped</Badge>
    </Case>
    <Case value={"down"}>
      <Badge variant="destructive-light">Down</Badge>
    </Case>
    <Default>
      <Badge variant="outline">{value}</Badge>
    </Default>
  </Switch>
  )
}

export function VhostClusterStatePanel({
  state,
}: {
  state: Record<string, string>
}) {
  const entries = Object.entries(state)
  const facts: Fact[] = entries.length
    ? entries.map(([node, value]) => ({
        label: node,
        value: nodeStateBadge(value),
        mono: true,
      }))
    : [{ label: "State", value: "No nodes reported" }]

  return (
    <FactPanel
      title="Cluster state"
      description="The state each node reports for this virtual host."
      facts={facts}
    />
  )
}