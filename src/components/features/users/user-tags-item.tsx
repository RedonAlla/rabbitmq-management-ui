import type { Dispatch, ReactNode, SetStateAction } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { USER_TAGS, type TagProps } from "./user-tags"


type Props = {
  isSelected: boolean
  option: TagProps
  setTag: Dispatch<SetStateAction<string>>
}

function UserTagItem({ isSelected, option, setTag }: Props): ReactNode {
  return (
    <label
      key={option.name}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border px-2.5 py-1 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-input hover:bg-accent/50"
      )}
    >
      <Checkbox
        checked={isSelected}
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
}

export function UserTagsList({
  tag,
  setTag,
}: {
  tag: string
  setTag: Dispatch<SetStateAction<string>>
}) {
  return (
    <div className="flex flex-col gap-2">
      {USER_TAGS.map((option) => (
        <UserTagItem
          key={option.name}
          isSelected={tag === option.name}
          option={option}
          setTag={setTag}
        />
      ))}
    </div>
  )
}