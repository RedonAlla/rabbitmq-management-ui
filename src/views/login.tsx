import { useState, type FormEvent } from "react"
import {
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/store/auth"
import { useCluster } from "@/store/cluster"

export function LoginView() {
  const { login, pending } = useAuth()
  const { data } = useCluster()
  const { theme, setTheme } = useTheme()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [formError, setFormError] = useState("")

  const isDark =
    theme === "dark" ||
    (theme === "system" && document.documentElement.classList.contains("dark"))

  const changeUsername = (value: string) => {
    setUsername(value)
    setUsernameError("")
    setFormError("")
  }

  const changePassword = (value: string) => {
    setPassword(value)
    setPasswordError("")
    setFormError("")
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const clean = username.trim()
    const nextUsernameError = clean ? "" : "Enter your username."
    const nextPasswordError = password ? "" : "Enter your password."
    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)
    setFormError("")
    if (nextUsernameError || nextPasswordError) return

    const failure = await login(clean, password)
    if (failure) {
      setFormError(failure)
      return
    }
    toast.success("Signed in", { description: `Welcome back, ${clean}.` })
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="absolute top-4 right-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? (
            <SunIcon aria-hidden="true" />
          ) : (
            <MoonIcon aria-hidden="true" />
          )}
        </Button>
      </div>

      <Card className="w-full max-w-sm ring-1 ring-foreground/10">
        <CardHeader className="justify-items-center gap-3 text-center">
          <IconTile variant="solid" size="lg" aria-hidden="true">
            <span className="text-mono text-sm font-semibold">RQ</span>
          </IconTile>
          <div className="flex flex-col gap-0.5">
            <CardTitle>RabbitMQ Management</CardTitle>
            <CardDescription>
              {data.cluster.name
                ? `Sign in to manage ${data.cluster.name}.`
                : "Sign in with your RabbitMQ credentials."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-username">Username</Label>
              <InputGroup>
                <InputGroupAddon>
                  <UserIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="login-username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  placeholder="admin"
                  value={username}
                  disabled={pending}
                  aria-invalid={usernameError ? true : undefined}
                  aria-describedby={
                    usernameError ? "login-username-error" : undefined
                  }
                  onChange={(event) => changeUsername(event.target.value)}
                />
              </InputGroup>
              {usernameError ? (
                <p
                  id="login-username-error"
                  role="alert"
                  className="text-xs text-destructive-foreground"
                >
                  {usernameError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">Password</Label>
              <InputGroup>
                <InputGroupAddon>
                  <KeyRoundIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  disabled={pending}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={
                    passwordError ? "login-password-error" : undefined
                  }
                  onChange={(event) => changePassword(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={pending}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? (
                      <EyeOffIcon aria-hidden="true" />
                    ) : (
                      <EyeIcon aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {passwordError ? (
                <p
                  id="login-password-error"
                  role="alert"
                  className="text-xs text-destructive-foreground"
                >
                  {passwordError}
                </p>
              ) : null}
            </div>

            {formError ? (
              <Alert variant="destructive">
                <CircleAlertIcon aria-hidden="true" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Spinner aria-hidden="true" /> : null}
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
