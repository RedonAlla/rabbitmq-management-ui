import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"

interface CaseProps<T> {
  value: T
  children?: ReactNode
}

interface DefaultProps {
  children?: ReactNode
}

interface SwitchProps<T> {
  condition: T | ((value: T) => boolean)
  children?: ReactNode
}

function Case<T>({ children }: CaseProps<T>) {
  return <>{children}</>
}

Case.componentName = "case" as const

function Default({ children }: DefaultProps) {
  return <>{children}</>
}

Default.componentName = "default" as const

function Switch<T>({ condition, children }: SwitchProps<T>) {
  const cases: ReactElement[] = []
  const defaults: ReactElement[] = []

  // toArray assigns stable keys, so returning the array doesn't trigger key warnings
  Children.toArray(children).forEach((item) => {
    if (!isValidElement(item)) return

    const name = (item.type as { componentName?: string }).componentName

    if (name === "case") {
      const { value } = item.props as CaseProps<T>
      const matches =
        typeof condition === "function"
          ? (condition as (value: T) => boolean)(value)
          : condition === value

      if (matches) cases.push(item)
    } else if (name === "default") {
      defaults.push(item)
    }
  })

  const result = cases.length > 0 ? cases : defaults
  return result.length === 0 ? null : <>{result}</>
}

export { Switch, Case, Default }
