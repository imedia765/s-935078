import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import debounce from "lodash/debounce";

interface SearchBarProps {
  onSearch: (term: string, type: "full_name" | "member_number") => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchType, setSearchType] = useState<"full_name" | "member_number">("full_name");

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onSearch(term, searchType);
    }, 500),
    [searchType, onSearch]
  );

  return (
    <div className="flex gap-2">
      <select 
        className="bg-background border border-input rounded-md px-3 py-2"
        value={searchType}
        onChange={(e) => setSearchType(e.target.value as "full_name" | "member_number")}
      >
        <option value="full_name">Search by Name</option>
        <option value="member_number">Search by Member ID</option>
      </select>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search by ${searchType === 'full_name' ? 'name' : 'member ID'}...`}
          onChange={(e) => debouncedSearch(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}