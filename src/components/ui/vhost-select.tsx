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
}: {
  value: string
  onChange: (value: string) => void
  id?: string
}) {
  const { data } = useCluster()
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data.vhosts.map((vhost) => (
          <SelectItem key={vhost.name} value={vhost.name}>
            {vhost.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
