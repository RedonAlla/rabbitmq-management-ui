import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import ShortcutsDialog from "@/components/layout/shortcuts-dialog"
import EditClusterNameDialog from "@/components/features/cluster/edit-cluster-name-dialog"
import {
  AddExchangeDrawer,
  PublishDrawer
} from "@/components/features/exchanges/list"
import EditLimitsDialog from "@/components/features/limits/edit-limits-dialog"
import EditUserLimitsDialog from "@/components/features/limits/edit-user-limits-dialog"
import AddPolicyDrawer from "@/views/policies/add-policy-drawer"
import { AddQueueDrawer } from "@/components/features/queues/list"
import { AddUserDialog, EditUserDialog } from "@/components/features/users"
import { AddVhostDrawer } from "@/components/features/vhosts/add-vhost-drawer"
import type { Policy, User, Vhost } from "@/data/types"
import { useCluster } from "@/store/cluster"

export type DialogRequest =
  | { type: "add-queue"; onCreated?: () => void }
  | { type: "add-exchange" }
  | { type: "add-user" }
  | { type: "edit-user"; user: User }
  | { type: "add-vhost" }
  | { type: "edit-vhost"; vhost: Vhost }
  | { type: "add-policy" }
  | { type: "edit-policy"; policy: Policy }
  | { type: "add-operator-policy" }
  | { type: "edit-operator-policy"; policy: Policy }
  | { type: "edit-limits"; vhost?: string }
  | { type: "edit-user-limits"; user?: string }
  | { type: "edit-cluster-name" }
  | { type: "publish"; exchange?: string; vhost?: string }
  | { type: "shortcuts" }

interface DialogsContextValue {
  dialog: DialogRequest | null
  openDialog: (request: DialogRequest) => void
  closeDialog: () => void
}

const DialogsContext = createContext<DialogsContextValue | null>(null)

export function DialogsProvider({ children }: { children: ReactNode }) {
  const { data } = useCluster()
  const cluster = data.cluster
  const [dialog, setDialog] = useState<DialogRequest | null>(null)
  const closeDialog = () => setDialog(null)

  const value = useMemo<DialogsContextValue>(
    () => ({ dialog, openDialog: setDialog, closeDialog }),
    [dialog]
  )

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddQueueDrawer
        open={dialog?.type === "add-queue"}
        onClose={closeDialog}
        onCreated={dialog?.type === "add-queue" ? dialog.onCreated : undefined}
      />
      <AddExchangeDrawer
        open={dialog?.type === "add-exchange"}
        onClose={closeDialog}
      />
      <AddUserDialog open={dialog?.type === "add-user"} onClose={closeDialog} />
      <EditUserDialog
        key={dialog?.type === "edit-user" ? dialog.user.username : "edit-user"}
        open={dialog?.type === "edit-user"}
        user={dialog?.type === "edit-user" ? dialog.user : null}
        onClose={closeDialog}
      />
      <AddVhostDrawer
        key={
          dialog?.type === "edit-vhost"
            ? `edit-${dialog.vhost.name}`
            : "add-vhost"
        }
        open={dialog?.type === "add-vhost" || dialog?.type === "edit-vhost"}
        vhost={dialog?.type === "edit-vhost" ? dialog.vhost : null}
        onClose={closeDialog}
      />
      <AddPolicyDrawer
        key={
          dialog?.type === "edit-policy"
            ? `edit-${dialog.policy.vhost}/${dialog.policy.name}`
            : "add-policy"
        }
        open={dialog?.type === "add-policy" || dialog?.type === "edit-policy"}
        onClose={closeDialog}
        policy={dialog?.type === "edit-policy" ? dialog.policy : null}
      />
      <AddPolicyDrawer
        key={
          dialog?.type === "edit-operator-policy"
            ? `edit-operator-${dialog.policy.vhost}/${dialog.policy.name}`
            : "add-operator-policy"
        }
        open={
          dialog?.type === "add-operator-policy" ||
          dialog?.type === "edit-operator-policy"
        }
        onClose={closeDialog}
        operator
        policy={
          dialog?.type === "edit-operator-policy" ? dialog.policy : null
        }
      />
      <PublishDrawer
        open={dialog?.type === "publish"}
        onClose={closeDialog}
        initialExchange={
          dialog?.type === "publish" ? dialog.exchange : undefined
        }
        initialVhost={dialog?.type === "publish" ? dialog.vhost : undefined}
      />
      <EditLimitsDialog
        key={
          dialog?.type === "edit-limits"
            ? `vhost-limits-${dialog.vhost ?? "new"}`
            : "vhost-limits-closed"
        }
        open={dialog?.type === "edit-limits"}
        onClose={closeDialog}
        initialVhost={dialog?.type === "edit-limits" ? dialog.vhost : undefined}
      />
      <EditUserLimitsDialog
        key={
          dialog?.type === "edit-user-limits"
            ? `user-limits-${dialog.user ?? "new"}`
            : "user-limits-closed"
        }
        open={dialog?.type === "edit-user-limits"}
        onClose={closeDialog}
        initialUser={
          dialog?.type === "edit-user-limits" ? dialog.user : undefined
        }
      />
      <EditClusterNameDialog
        key={
          dialog?.type === "edit-cluster-name"
            ? `cluster-name-${cluster.name}`
            : "cluster-name-closed"
        }
        open={dialog?.type === "edit-cluster-name"}
        initialName={cluster.name}
        onClose={closeDialog}
      />
      <ShortcutsDialog
        open={dialog?.type === "shortcuts"}
        onClose={closeDialog}
      />
    </DialogsContext.Provider>
  )
}

export function useDialogs(): DialogsContextValue {
  const context = useContext(DialogsContext)
  if (!context)
    throw new Error("useDialogs must be used inside DialogsProvider")
  return context
}
