import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import ShortcutsDialog from "@/components/layout/shortcuts-dialog"
import {
  AddExchangeDrawer,
  PublishDrawer
} from "@/components/features/exchanges/list"
import EditLimitsDialog from "@/views/limits/edit-limits-dialog"
import AddPolicyDialog from "@/views/policies/add-policy-dialog"
import { AddQueueDrawer } from "@/components/features/queues/list"
import { AddUserDialog } from "@/components/features/users/list"
import AddVhostDialog from "@/views/vhosts/add-vhost-dialog"

export type DialogRequest =
  | { type: "add-queue"; onCreated?: () => void }
  | { type: "add-exchange" }
  | { type: "add-user" }
  | { type: "add-vhost" }
  | { type: "add-policy" }
  | { type: "add-operator-policy" }
  | { type: "edit-limits"; vhost?: string }
  | { type: "publish"; exchange?: string; vhost?: string }
  | { type: "shortcuts" }

interface DialogsContextValue {
  dialog: DialogRequest | null
  openDialog: (request: DialogRequest) => void
  closeDialog: () => void
}

const DialogsContext = createContext<DialogsContextValue | null>(null)

export function DialogsProvider({ children }: { children: ReactNode }) {
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
      <AddVhostDialog
        open={dialog?.type === "add-vhost"}
        onClose={closeDialog}
      />
      <AddPolicyDialog
        open={dialog?.type === "add-policy"}
        onClose={closeDialog}
      />
      <AddPolicyDialog
        open={dialog?.type === "add-operator-policy"}
        onClose={closeDialog}
        operator
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
        open={dialog?.type === "edit-limits"}
        onClose={closeDialog}
        initialVhost={dialog?.type === "edit-limits" ? dialog.vhost : undefined}
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
