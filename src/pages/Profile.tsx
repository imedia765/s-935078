import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Users,
  Edit2,
  FileText,
  Trash2,
  Home,
  MapPin,
  Building,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Profile {
  id: string;
  member_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  town: string;
  postcode: string;
  status: string;
  date_of_birth: string | null;
  marital_status: string | null;
  membership_type: string | null;
  gender: string | null;
  collector: string | null;
  auth_user_id: string | null;
  payment_status: string;
  next_payment_due: string;
  amount_due: number;
  bank_name?: string;
  account_name?: string;
  sort_code?: string;
  account_number?: string;
  family_members?: Array<{
    full_name: string;
    relationship: string;
    date_of_birth: string;
  }>;
  payment_history?: Array<{
    date: string;
    type: string;
    amount: number;
    status: string;
    reference: string;
  }>;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        console.log('Fetching profile for auth_user_id:', user.id);
        const { data: memberData, error } = await supabase
          .from("members")
          .select(`
            *,
            family_members (
              full_name,
              relationship,
              date_of_birth
            ),
            payment_history (
              date,
              type,
              amount,
              status,
              reference
            )
          `)
          .eq("auth_user_id", user.id)
          .single();

        if (error) throw error;

        console.log('Fetched member data:', memberData);
        setProfile(memberData);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  if (!profile) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'approved':
        return 'bg-green-500/20 text-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-red-500/20 text-red-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Member Dashboard */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Member Dashboard</h1>
        
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {profile.full_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  {profile.full_name}
                  <Badge className={getStatusColor(profile.status)}>
                    {profile.status}
                  </Badge>
                </h2>
                <p className="text-muted-foreground">Member #{profile.member_number}</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Home className="h-4 w-4 mt-1" />
                <div>
                  <div>{profile.address}</div>
                  <div>{profile.town}</div>
                  <div>{profile.postcode}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>DOB: {profile.date_of_birth && format(new Date(profile.date_of_birth), 'PP')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" />
                <span>Gender: {profile.gender || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Marital Status: {profile.marital_status || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Collector: {profile.collector}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Membership Details */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Membership Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{profile.membership_type || 'Standard'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge className={getStatusColor(profile.payment_status)}>
                {profile.payment_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Payment Due</p>
              <p className="font-medium">
                {profile.next_payment_due && format(new Date(profile.next_payment_due), 'PP')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="font-medium">£{profile.amount_due?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>

        {/* Family Members */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </h3>
            <Button variant="outline" size="sm">
              Add Member
            </Button>
          </div>
          <div className="space-y-4">
            {profile.family_members?.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5"
              >
                <div>
                  <p className="font-medium">{member.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.relationship} • DOB: {format(new Date(member.date_of_birth), 'PP')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bank Details */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Bank Name</p>
              <p className="font-medium">{profile.bank_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Name</p>
              <p className="font-medium">{profile.account_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sort Code</p>
              <p className="font-medium">{profile.sort_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="font-medium">{profile.account_number}</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>IMPORTANT:</strong> You must use your member number ({profile.member_number}) as the payment reference when making bank transfers.
            </p>
          </div>
        </Card>

        {/* Payment History */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {profile.payment_history?.map((payment, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4">{format(new Date(payment.date), 'PP')}</td>
                    <td className="py-4">{payment.type}</td>
                    <td className="py-4">£{payment.amount.toFixed(2)}</td>
                    <td className="py-4">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-4">{payment.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;