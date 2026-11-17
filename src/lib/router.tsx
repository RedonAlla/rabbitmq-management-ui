import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export interface Route {
  view: string
  id?: string
}

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "").split("?")[0]
  if (!clean) return { view: "overview" }
  const [view, ...rest] = clean.split("/")
  const id = rest.join("/")
  return id ? { view, id: decodeURIComponent(id) } : { view }
}

interface RouterValue {
  route: Route
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash)
  )

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  const navigate = useCallback((path: string) => {
    const next = path.startsWith("#")
      ? path
      : `#${path.startsWith("/") ? path : `/${path}`}`
    if (window.location.hash === next) {
      setRoute(parseHash(next))
      return
    }
    window.location.hash = next
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  )
}

export function useRoute(): RouterValue {
  const context = useContext(RouterContext)
  if (!context) throw new Error("useRoute must be used inside RouterProvider")
  return context
}

export function routeHref(view: string, id?: string): string {
  return id ? `#/${view}/${encodeURIComponent(id)}` : `#/${view}`
}
