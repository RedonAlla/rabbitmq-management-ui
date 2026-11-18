import { Waypoints } from "lucide-react"
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
import type { UserTopicPermission } from "@/lib/rabbit-api"

export function UserTopicPermissionsFrame({
  permissions,
}: {
  permissions: UserTopicPermission[]
}) {
  return (
    <SectionFrame
      title="Topic permissions"
      description="Topic permissions restrict this user to specific topic exchanges."
      bodyClassName={permissions.length ? "p-0" : undefined}
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
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={routeHref("exchanges")} />}
              >
                Open exchanges
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConditionalRender>
    </SectionFrame>
  )
}
