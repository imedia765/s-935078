import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";

interface PersonalInfoSectionProps {
  formData: {
    full_name: string;
    address: string;
    town: string;
    postcode: string;
    email: string;
    phone: string;
    date_of_birth: string;
    marital_status: string;
    gender: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export const PersonalInfoSection = ({
  formData,
  handleInputChange,
  handleSelectChange,
}: PersonalInfoSectionProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name
        </label>
        <Input 
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Address
        </label>
        <Textarea 
          name="address"
          value={formData.address}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Town</label>
        <Input 
          name="town"
          value={formData.town}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Post Code</label>
        <Input 
          name="postcode"
          value={formData.postcode}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </label>
        <Input 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          type="email"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Mobile No
        </label>
        <Input 
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          type="tel"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date of Birth
        </label>
        <Input 
          name="date_of_birth"
          value={formData.date_of_birth}
          onChange={handleInputChange}
          type="date"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Marital Status</label>
        <Select 
          value={formData.marital_status}
          onValueChange={(value) => handleSelectChange("marital_status", value)}
        >
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
        <label className="text-sm font-medium">Gender</label>
        <Select 
          value={formData.gender}
          onValueChange={(value) => handleSelectChange("gender", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};