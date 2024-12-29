import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Member } from "@/components/members/types";

interface PersonalInfoFormProps {
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
  onInputChange: (field: string, value: string) => void;
}

export const PersonalInfoForm = ({ formData, onInputChange }: PersonalInfoFormProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name
        </label>
        <Input 
          value={formData.full_name} 
          onChange={(e) => onInputChange('full_name', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Address
        </label>
        <Textarea 
          value={formData.address} 
          onChange={(e) => onInputChange('address', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Town</label>
        <Input 
          value={formData.town} 
          onChange={(e) => onInputChange('town', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Post Code</label>
        <Input 
          value={formData.postcode} 
          onChange={(e) => onInputChange('postcode', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </label>
        <Input 
          value={formData.email} 
          onChange={(e) => onInputChange('email', e.target.value)}
          type="email" 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Mobile No
        </label>
        <Input 
          value={formData.phone} 
          onChange={(e) => onInputChange('phone', e.target.value)}
          type="tel" 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date of Birth
        </label>
        <Input 
          type="date" 
          value={formData.date_of_birth} 
          onChange={(e) => onInputChange('date_of_birth', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Marital Status</label>
        <Select 
          value={formData.marital_status} 
          onValueChange={(value) => onInputChange('marital_status', value)}
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
          onValueChange={(value) => onInputChange('gender', value)}
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