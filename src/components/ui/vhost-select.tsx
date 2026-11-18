import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCluster } from "@/store/cluster"

export default function VhostSelect({
  value,
  onChange,
  id,
  exclude = [],
}: {
  value: string
  onChange: (value: string) => void
  id?: string
  exclude?: string[]
}) {
  const { data } = useCluster()
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data.vhosts
          .filter((vhost) => !exclude.includes(vhost.name))
          .map((vhost) => (
            <SelectItem key={vhost.name} value={vhost.name}>
              {vhost.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
