import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { countries } from "@/data/countries";

interface CountryListProps {
  value?: string;
  onSelect: (value: string) => void;
}

export const CountryList = ({ value, onSelect }: CountryListProps) => {
  return (
    <Command>
      <CommandInput placeholder="Search country..." />
      <CommandEmpty>No country found.</CommandEmpty>
      <CommandGroup className="max-h-[200px] overflow-y-auto">
        {countries.map((country) => (
          <CommandItem
            key={country}
            value={country}
            onSelect={() => onSelect(country)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === country ? "opacity-100" : "opacity-0"
              )}
            />
            {country}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
};