import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { RegionSkeleton } from "@/components/region-states"
import { UserBackButton } from "./header"

export function UserDetailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={title}
        description="Loading user details."
        actions={<UserBackButton />}
      />
      <DetailLayout
        main={
          <>
            <SectionFrame title="Permissions">
              <RegionSkeleton rows={3} />
            </SectionFrame>
            <SectionFrame title="Topic permissions">
              <RegionSkeleton rows={3} />
            </SectionFrame>
          </>
        }
        side={
          <>
            <SectionFrame title="User">
              <RegionSkeleton rows={6} />
            </SectionFrame>
            <SectionFrame title="Limits">
              <RegionSkeleton rows={2} />
            </SectionFrame>
          </>
        }
      />
    </div>
  )
}
