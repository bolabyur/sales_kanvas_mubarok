import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  options: SelectOption[];
  placeholder?: string;
  /** Controlled; "" = belum dipilih. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Ikut terkirim di FormData lewat hidden input base-ui. */
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

export function SelectInput({
  options,
  placeholder = "Pilih…",
  value,
  defaultValue,
  onValueChange,
  size,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  ...root
}: Props) {
  return (
    <Select
      items={options}
      {...(value !== undefined
        ? { value: value || null }
        : { defaultValue: defaultValue || null })}
      onValueChange={(v) => onValueChange?.((v as string | null) ?? "")}
      {...root}
    >
      <SelectTrigger
        size={size}
        className={cn("w-full", className)}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
