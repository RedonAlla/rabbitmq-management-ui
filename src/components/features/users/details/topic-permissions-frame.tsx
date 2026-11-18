import { PlusIcon, Trash2Icon, Waypoints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionFrame } from "@/components/detail"
import { RegionEmpty } from "@/components/region-states"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConditionalRender } from "@/components/conditional-render"
import { useCluster } from "@/store/cluster"
import type { UserTopicPermission } from "@/lib/rabbit-api"

export function UserTopicPermissionsFrame({
  permissions,
  onAdd,
  onRemove,
}: {
  permissions: UserTopicPermission[]
  onAdd: () => void
  onRemove: (permission: UserTopicPermission) => void
}) {
  const { data } = useCluster()
  const canAdd = data.exchanges.some(
    (exchange) =>
      exchange.type === "topic" &&
      !exchange.internal &&
      !permissions.some(
        (permission) =>
          permission.vhost === exchange.vhost &&
          permission.exchange === exchange.name
      )
  )

  return (
    <SectionFrame
      title="Topic permissions"
      description="Topic permissions restrict this user to specific topic exchanges."
      bodyClassName={permissions.length ? "p-0" : undefined}
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canAdd}
          onClick={onAdd}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add topic permission
        </Button>
      }
    >
      <ConditionalRender
        condition={permissions.length > 0}
        default={
          <RegionEmpty
            title="No topic permissions"
            description="Topic access follows the virtual host permissions above."
            icon={<Waypoints />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                onClick={onAdd}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Add topic permission
              </Button>
            }
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Virtual host</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Write</TableHead>
              <TableHead>Read</TableHead>
              <TableHead className="w-px text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={`${permission.vhost}-${permission.exchange}`}>
                <TableCell className="data-cell text-xs text-muted-foreground">
                  {permission.vhost}
                </TableCell>
                <TableCell className="data-cell font-medium">
                  {permission.exchange}
                </TableCell>
                <TableCell className="data-cell text-xs text-muted-foreground">
                  {permission.write || "(empty)"}
                </TableCell>
                <TableCell className="data-cell text-xs text-muted-foreground">
                  {permission.read || "(empty)"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      aria-label={`Remove topic permission for ${permission.exchange} on ${permission.vhost}`}
                      onClick={() => onRemove(permission)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConditionalRender>
    </SectionFrame>
  )
}
