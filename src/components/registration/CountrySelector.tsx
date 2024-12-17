import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UseFormRegister } from "react-hook-form";
import { CountryList } from "./CountryList";

interface CountrySelectorProps {
  register: UseFormRegister<any>;
}

export const CountrySelector = ({ register }: CountrySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  const handleSelect = (value: string) => {
    setSelectedCountry(value);
    register("country").onChange({ target: { value } });
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="country">Country</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCountry || "Select country..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <CountryList value={selectedCountry} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
};