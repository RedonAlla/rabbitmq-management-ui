import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ChartRangeTabs<T extends number>({
  value,
  onChange,
  options,
  ariaLabel = "Chart range",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; ariaLabel: string }[];
  ariaLabel?: string;
}) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as T)}
    >
      <TabsList aria-label={ariaLabel}>
        {options.map((item) => (
          <TabsTrigger
            key={item.value}
            value={String(item.value)}
            aria-label={item.ariaLabel}
            className="px-2 text-xs"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
