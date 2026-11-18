export type TagProps = {
  name: string,
  description: string
}

export const USER_TAGS: TagProps[] = [
  {
    name: "administrator",
    description:
      "User can do everything monitoring can do, manage users, vhosts and permissions, close other user's connections, and manage policies and parameters for all vhosts.",
  },
  {
    name: "management",
    description:
      "Sign in to the management UI and view resources in assigned virtual hosts.",
  },
  {
    name: "policymaker",
    description:
      "User can access the management plugin and manage policies and parameters for the vhosts they have access to.",
  },
  {
    name: "monitoring",
    description:
      "User can access the management plugin and see all connections and channels as well as node-related information.",
  },
]
