"use client";

import { Select, SelectItem, type Selection } from "@nextui-org/react";
import { ArrowUpDown } from "lucide-react";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";

const SORT_OPTIONS = [
  { key: "rating_desc", label: "Rating (Mayor)" },
  { key: "value_desc", label: "Valor (Mayor)" },
  { key: "value_asc", label: "Valor (Menor)" },
  { key: "age_asc", label: "Edad (Menor)" },
  { key: "age_desc", label: "Edad (Mayor)" },
] as const;

interface Props {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function SortSelect({ value, onChange, className = "" }: Props) {
  return (
    <Select
      aria-label="Ordenar por"
      placeholder="Ordenar por"
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={(keys: Selection) => {
        const k = Array.from(keys)[0];
        if (k != null) onChange(String(k));
      }}
      startContent={<ArrowUpDown size={16} className="text-muted flex-shrink-0 pointer-events-none" />}
      className={className}
      classNames={{
        trigger: `${sharedSelectClasses.trigger} h-12 min-h-12 pl-2`,
        value: sharedSelectClasses.value,
        popoverContent: sharedSelectClasses.popoverContent,
      }}
    >
      {SORT_OPTIONS.map((o) => (
        <SelectItem key={o.key} textValue={o.label} classNames={sharedSelectItemClasses}>
          {o.label}
        </SelectItem>
      ))}
    </Select>
  );
}
