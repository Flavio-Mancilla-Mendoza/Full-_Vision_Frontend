import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  delay?: number;
  onChange?: (value: string) => void; // immediate
  onDebouncedChange?: (value: string) => void; // debounced
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = "",
  placeholder = "Buscar...",
  delay = 300,
  onChange,
  onDebouncedChange,
  className,
}) => {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, delay);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (onDebouncedChange) onDebouncedChange(debounced);
  }, [debounced, onDebouncedChange]);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={local}
          onChange={(e) => {
            setLocal(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          className="pl-8"
        />
      </div>
    </div>
  );
};
