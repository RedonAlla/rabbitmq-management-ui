import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { useCluster } from "@/store/cluster"
import { UserTagsList } from "../user-tags-item"

export function AddUserDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data, actions } = useCluster()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [noPassword, setNoPassword] = useState(false)
  const [tag, setTag] = useState("management")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = username.trim()

    if (!clean) return setError("Enter a username.")

    if (data.users.some((user) => user.username === clean))
      return setError(`${clean} already exists.`)

    if (!noPassword) {
      if (password.trim().length < 4)
        return setError("Use a password of at least 4 characters.")

      if (password !== confirmPassword)
        return setError("Passwords do not match.")
    }

    try {
      await actions.addUser({
        username: clean,
        password: noPassword ? undefined : password,
        tags: [tag],
        vhosts: ["/"],
      })

      toast.success("User created", {
        description: noPassword
          ? `${clean} has the ${tag} tag and no password.`
          : `${clean} has the ${tag} tag.`,
      })

      setUsername("")
      setPassword("")
      setConfirmPassword("")
      setNoPassword(false)
      setTag("management")
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
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>Add user</SheetTitle>
            <SheetDescription>
              Create a user and choose the tags that grant management access.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <Field label="Username" htmlFor="user-name">
              <Input
                id="user-name"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setError("")
                }}
                placeholder="reporting"
                autoFocus
              />
            </Field>
            <ToggleField
              label="Create without password"
              info="Create the user now and set a password later. The user cannot sign in until a password is set."
              checked={noPassword}
              onCheckedChange={(checked) => {
                setNoPassword(checked)
                setError("")
                if (checked) {
                  setPassword("")
                  setConfirmPassword("")
                }
              }}
            />
            <ConditionalRender condition={!noPassword}>
              <Field label="Password" htmlFor="user-password">
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirm password" htmlFor="user-confirm-password">
                <Input
                  id="user-confirm-password"
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
                <UserTagsList setTag={setTag} tag={tag} />
              </div>
            </Field>
            <FormError>{error}</FormError>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
            <Button type="submit">Create user</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
