import { SectionFrame } from "@/components/detail"
import { PageHeader } from "@/components/page-header"
import { UserBackButton } from "./header"
import { ConditionalRender } from "@/components/conditional-render"
import { RegionEmpty, RegionError } from "@/components/region-states"
import { UserXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routeHref } from "@/lib/router"

type Props = {
  status: number | null
  username: string
  error: string
  retry: () => void
}

export function ErrorPage({status, username, error, retry}: Props) {
  const is404 = status === 404

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={ is404 ? "User not found" : username}
        description={
          is404
            ? "The broker does not know this user anymore."
            : "Could not load this user."
        }
        actions={<UserBackButton />}
      />
      <SectionFrame title="User">
        <ConditionalRender
          condition={is404}
          default={<RegionError message={error} onRetry={retry} />}
        >
          <RegionEmpty
            title="User not found"
            description={`No internal user named ${username} exists on this cluster. Users authenticated elsewhere, such as over LDAP, do not appear here.`}
            icon={<UserXIcon />}
            action={
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={routeHref("users")} />}
              >
                Back to users
              </Button>
            }
          />
        </ConditionalRender>
      </SectionFrame>
    </div>
  )
}
