import { GlobeIcon, PencilIcon } from "lucide-react"
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
import { routeHref } from "@/lib/router"
import type { UserPermission } from "@/lib/rabbit-api"

export function UserPermissionsFrame({
  permissions,
  onEdit,
}: {
  permissions: UserPermission[]
  onEdit: (permission: UserPermission) => void
}) {
  return (
    <SectionFrame
      title="Permissions"
      description={`${permissions.length} virtual host ${
        permissions.length === 1 ? "permission grants" : "permissions grant"
      } configure, write and read access.`}
      bodyClassName={permissions.length ? "p-0" : undefined}
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
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={routeHref("vhosts")} />}
              >
                Open virtual hosts
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Edit permissions for ${permission.vhost}`}
                    onClick={() => onEdit(permission)}
                  >
                    <PencilIcon aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConditionalRender>
    </SectionFrame>
  )
}
