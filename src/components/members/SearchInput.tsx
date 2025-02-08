
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import debounce from "lodash/debounce";

interface SearchInputProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

export function SearchInput({ onSearch, placeholder = "Search..." }: SearchInputProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setLocalSearchTerm(newTerm);
    debouncedSearch(newTerm);
  };

  return (
    <div className="relative flex-1 md:flex-initial">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={localSearchTerm}
        onChange={handleSearchChange}
        className="pl-9 w-full bg-card text-card-foreground"
      />
    </div>
  );
}
