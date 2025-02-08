
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

export function SearchInput({ onSearch, placeholder = "Search..." }: SearchInputProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className="relative flex-1 md:flex-initial">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        onChange={handleSearchChange}
        className="pl-9 w-full bg-card text-card-foreground"
      />
    </div>
  );
}
