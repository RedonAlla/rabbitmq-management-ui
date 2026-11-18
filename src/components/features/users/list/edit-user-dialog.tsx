import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConditionalRender } from "@/components/conditional-render"
import Field from "@/components/ui/field"
import FormError from "@/components/ui/form-error"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import ToggleField from "@/components/ui/toggle-field"
import { cn } from "@/lib/utils"
import { useCluster } from "@/store/cluster"
import type { User } from "@/data/types"
import { USER_TAGS } from "./user-tags"

export function EditUserDialog({
  open,
  user,
  onClose,
}: {
  open: boolean
  user: User | null
  onClose: () => void
}) {
  const { actions } = useCluster()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [tag, setTag] = useState(user?.tags[0] ?? "management")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    if (!removePassword) {
      if (password.trim().length < 4)
        return setError("Use a password of at least 4 characters.")

      if (password !== confirmPassword)
        return setError("Passwords do not match.")
    }

    try {
      await actions.updateUser({
        username: user.username,
        password: removePassword ? undefined : password,
        tags: [tag],
      })

      toast.success("User updated", {
        description: removePassword
          ? `${user.username} has the ${tag} tag and no password.`
          : `${user.username} has the ${tag} tag.`,
      })

      setPassword("")
      setConfirmPassword("")
      setRemovePassword(false)
      setError("")
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The management API did not respond."
      )
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>
              Update the password and tags that grant management access.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <Field label="Username" htmlFor="edit-user-name">
              <Input
                id="edit-user-name"
                value={user?.username ?? ""}
                disabled
              />
            </Field>
            <ToggleField
              label="Remove password"
              info="Saving without a new password clears the current one. The user cannot sign in until a password is set."
              checked={removePassword}
              onCheckedChange={(checked) => {
                setRemovePassword(checked)
                setError("")
                if (checked) {
                  setPassword("")
                  setConfirmPassword("")
                }
              }}
            />
            <ConditionalRender condition={!removePassword}>
              <Field label="New password" htmlFor="edit-user-password">
                <Input
                  id="edit-user-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                  autoFocus
                />
              </Field>
              <Field
                label="Confirm password"
                htmlFor="edit-user-confirm-password"
              >
                <Input
                  id="edit-user-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                />
              </Field>
            </ConditionalRender>
            <Field label="Tags">
              <div className="flex flex-col gap-2">
                {USER_TAGS.map((option) => {
                  const selected = tag === option.name
                  return (
                    <label
                      key={option.name}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-2.5 py-1 transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent/50"
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => setTag(option.name)}
                        className="mt-0.5"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {option.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </Field>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
            <Button type="submit">Save changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
