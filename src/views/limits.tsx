import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserLimitsTable, VhostLimitsTable } from "@/components/features/limits"
import { useDialogs } from "@/components/dialogs/dialogs-provider"

type LimitsTab = "vhosts" | "users"

export function LimitsView() {
  const { openDialog } = useDialogs()
  const [tab, setTab] = useState<LimitsTab>("vhosts")

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Limits"
        description="Connection and queue caps per virtual host, and connection and channel caps per user."
        actions={
          <Button
            type="button"
            onClick={() =>
              openDialog(
                tab === "vhosts"
                  ? { type: "edit-limits" }
                  : { type: "edit-user-limits" }
              )
            }
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add limits
          </Button>
        }
      />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as LimitsTab)}
        className="min-w-0 gap-4"
      >
        <TabsList>
          <TabsTrigger value="vhosts">Virtual hosts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="vhosts" className="min-w-0">
          <VhostLimitsTable />
        </TabsContent>
        <TabsContent value="users" className="min-w-0">
          <UserLimitsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
