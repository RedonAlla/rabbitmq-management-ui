import { PageHeader } from "@/components/page-header"
import UserPolicies from "./policies/UserPolicies"
import OperatorPolicies from "./policies/OperatorPolicies"

export function PoliciesView() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Policies"
        description="Pattern-based limits and behaviour applied to queues and exchanges."
      />
      <UserPolicies />
      <OperatorPolicies />
    </div>
  )
}
