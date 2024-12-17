import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormRegister } from "react-hook-form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PersonalInfoProps {
  register: UseFormRegister<any>;
}

const countries = [
  "United Kingdom",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  // Add more countries as needed
];

export const PersonalInfoSection = ({ register }: PersonalInfoProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="fullName">Full Name</label>
          <Input
            id="fullName"
            {...register("fullName", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="address">Address</label>
          <Textarea
            id="address"
            {...register("address", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="town">Town</label>
          <Input
            id="town"
            {...register("town", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="postCode">Post Code</label>
          <Input
            id="postCode"
            {...register("postCode", { required: true })}
          />
        </div>
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
                {value
                  ? value
                  : "Select country..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country}
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        register("country").onChange({ target: { value: currentValue } });
                        setOpen(false);
                      }}
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
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label htmlFor="email">Email</label>
          <Input
            type="email"
            id="email"
            {...register("email", {
              required: true,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            id="password"
            {...register("password", {
              required: true,
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="mobile">Mobile No</label>
          <Input
            type="tel"
            id="mobile"
            {...register("mobile", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dob">Date of Birth</label>
          <Input
            type="date"
            id="dob"
            {...register("dob", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pob">Place of Birth</label>
          <Input
            id="pob"
            {...register("pob", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="maritalStatus">Marital Status</label>
          <Select onValueChange={(value) => register("maritalStatus").onChange({ target: { value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Marital Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="gender">Gender</label>
          <Select onValueChange={(value) => register("gender").onChange({ target: { value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};