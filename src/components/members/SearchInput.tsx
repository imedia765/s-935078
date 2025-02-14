
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onSearch: (value: string) => void;
}

export function SearchInput({ value, placeholder, onSearch }: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="pl-9 w-full"
      />
    </div>
  );
}
