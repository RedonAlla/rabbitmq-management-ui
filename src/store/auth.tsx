import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export interface AuthUser {
  username: string
  role: string
}

interface AuthAccount {
  password: string
  role: string
}

const STORAGE_KEY = "rmq-session"

const ACCOUNTS: Record<string, AuthAccount> = {
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
    const parsed = JSON.parse(raw) as { username?: unknown }
    if (typeof parsed.username !== "string") return null
    const account = ACCOUNTS[parsed.username]
    if (!account) return null
    return { username: parsed.username, role: account.role }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [pending, setPending] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    setPending(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    const account = ACCOUNTS[username]
    if (!account || account.password !== password) {
      setPending(false)
      return "Invalid username or password."
    }
    const next: AuthUser = { username, role: account.role }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
    setPending(false)
    return null
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
