
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { memo } from "react";

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = memo(function SearchInput({ 
  value, 
  onSearch, 
  placeholder = "Search..." 
}: SearchInputProps) {
  return (
    <div className="relative flex-1 md:flex-initial">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-9 w-full bg-card text-card-foreground"
      />
    </div>
  );
});

