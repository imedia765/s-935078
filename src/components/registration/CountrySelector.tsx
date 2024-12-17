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
  const [value, setValue] = useState("");

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    register("country").onChange({ target: { value: currentValue } });
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
            {value || "Select country..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <CountryList value={value} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
};