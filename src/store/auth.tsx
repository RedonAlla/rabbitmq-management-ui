import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ApiError, loginWithPassword } from "@/lib/api"
import { IS_DEMO } from "@/lib/env"

export interface AuthUser {
  username: string
  role: string
  token: string
}

interface DemoAccount {
  password: string
  role: string
}

const STORAGE_KEY = "rmq-session"

const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  admin: { password: "admin", role: "administrator" },
  guest: { password: "guest", role: "administrator" },
}

interface AuthContextValue {
  user: AuthUser | null
  pending: boolean
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (typeof parsed.username !== "string" || typeof parsed.token !== "string") {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return {
      username: parsed.username,
      role: typeof parsed.role === "string" ? parsed.role : "monitoring",
      token: parsed.token,
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

async function demoLogin(
  username: string,
  password: string
): Promise<AuthUser | null> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  const account = DEMO_ACCOUNTS[username]
  if (!account || account.password !== password) return null
  return {
    username,
    role: account.role,
    token: btoa(`${username}:${password}`),
  }
}

async function apiLogin(
  username: string,
  password: string
): Promise<AuthUser> {
  const { user, token } = await loginWithPassword(username, password)
  return {
    username: user.name,
    role: user.tags.join(", ") || "monitoring",
    token: token.value,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [pending, setPending] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    setPending(true)
    try {
      const next = IS_DEMO
        ? await demoLogin(username, password)
        : await apiLogin(username, password)
      if (!next) return "Invalid username or password."
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setUser(next)
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message
      return "Cannot reach the RabbitMQ management API."
    } finally {
      setPending(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, pending, login, logout }),
    [user, pending, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
