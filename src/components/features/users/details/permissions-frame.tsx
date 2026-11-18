import { GlobeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
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
import type { UserPermission } from "@/lib/rabbit-api"

export function UserPermissionsFrame({
  permissions,
  onEdit,
  onAdd,
  onRemove,
}: {
  permissions: UserPermission[]
  onEdit: (permission: UserPermission) => void
  onAdd: () => void
  onRemove: (permission: UserPermission) => void
}) {
  const { data } = useCluster()
  const canAdd = data.vhosts.some(
    (vhost) =>
      !permissions.some((permission) => permission.vhost === vhost.name)
  )

  return (
    <SectionFrame
      title="Permissions"
      description={`${permissions.length} virtual host ${
        permissions.length === 1 ? "permission grants" : "permissions grant"
      } configure, write and read access.`}
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
          Add permission
        </Button>
      }
    >
      <ConditionalRender
        condition={permissions.length > 0}
        default={
          <RegionEmpty
            title="No permissions"
            description="This user cannot access any virtual host until a permission is granted."
            icon={<GlobeIcon />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                onClick={onAdd}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Add permission
              </Button>
            }
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Virtual host</TableHead>
              <TableHead>Configure</TableHead>
              <TableHead>Write</TableHead>
              <TableHead>Read</TableHead>
              <TableHead className="w-px text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.vhost}>
                <TableCell className="data-cell font-medium">
                  {permission.vhost}
                </TableCell>
                <TableCell className="data-cell text-xs text-muted-foreground">
                  {permission.configure || "(empty)"}
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
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit permissions for ${permission.vhost}`}
                      onClick={() => onEdit(permission)}
                    >
                      <PencilIcon aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      aria-label={`Remove permissions for ${permission.vhost}`}
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
