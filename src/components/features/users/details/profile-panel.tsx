import { Badge } from "@/components/reui/badge"
import { FactPanel, type Fact } from "@/components/detail"
import { fmtInt } from "@/lib/format"
import type { UserDetail } from "@/lib/rabbit-api"

export function UserProfilePanel({ detail }: { detail: UserDetail }) {
  const facts: Fact[] = [
    { label: "Username", value: detail.name, mono: true },
    {
      label: "Tags",
      value: detail.tags.length ? (
        <span className="flex flex-wrap justify-end gap-1">
          {detail.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </span>
      ) : (
        "No tags"
      ),
    },
    {
      label: "Password",
      value: (
        <Badge variant={detail.hasPassword ? "success-light" : "outline"}>
          {detail.hasPassword ? "Set" : "Not set"}
        </Badge>
      ),
    },
    {
      label: "Hashing",
      value: detail.hashingAlgorithm,
      mono: true,
    },
    {
      label: "Virtual hosts",
      value: fmtInt(detail.permissions.length),
    },
    {
      label: "Topic permissions",
      value: fmtInt(detail.topicPermissions.length),
    },
  ]

  return <FactPanel title="User" facts={facts} />
}
