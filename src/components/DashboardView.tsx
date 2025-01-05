import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MemberProfileCard from './MemberProfileCard';
import MonthlyChart from './MonthlyChart';
import MetricCard from './MetricCard';
import TotalCount from './TotalCount';
import { Users } from 'lucide-react';

const DashboardView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: memberProfile, isError } = useQuery({
    queryKey: ['memberProfile'],
    queryFn: async () => {
      console.log('Fetching member profile...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user logged in');

      // First get the member number from the user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const memberNumber = user?.user_metadata?.member_number;
      
      if (!memberNumber) {
        console.error('No member number found in user metadata');
        throw new Error('Member number not found');
      }

      console.log('Fetching member with number:', memberNumber);
      
      let query = supabase
        .from('members')
        .select('*');
      
      // Use the same OR condition approach as MembersList for more flexible matching
      query = query.or(`member_number.eq.${memberNumber},auth_user_id.eq.${session.user.id}`);
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching member:', error);
        toast({
          variant: "destructive",
          title: "Error fetching member profile",
          description: error.message
        });
        throw error;
      }

      if (!data) {
        console.error('No member found with number:', memberNumber);
        toast({
          variant: "destructive",
          title: "Member not found",
          description: "Could not find your member profile"
        });
        throw new Error('Member not found');
      }
      
      return data;
    },
  });

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">Dashboard</h1>
        <p className="text-dashboard-text">Welcome back!</p>
      </header>
      
      <div className="grid gap-6">
        <MemberProfileCard memberProfile={memberProfile} />
        
        {/* Financial Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MetricCard 
            title="Yearly Payment Status" 
            value={memberProfile?.yearly_payment_status === 'completed' ? 100 : 0}
            color={memberProfile?.yearly_payment_status === 'completed' ? '#4CAF50' : '#FFA726'} 
          />
          <MetricCard 
            title="Emergency Collection" 
            value={memberProfile?.emergency_collection_status === 'completed' ? 100 : 0}
            color={memberProfile?.emergency_collection_status === 'completed' ? '#4CAF50' : '#FFA726'} 
          />
          <MetricCard 
            title="Overall Status" 
            value={75} 
            color="#8989DE" 
          />
        </div>

        {/* Payment Summary */}
        <TotalCount 
          items={[
            {
              count: memberProfile?.yearly_payment_amount || 0,
              label: "Yearly Payment",
              icon: <Users className="h-4 w-4 text-dashboard-accent1" />
            },
            {
              count: memberProfile?.emergency_collection_amount || 0,
              label: "Emergency Collection",
              icon: <Users className="h-4 w-4 text-dashboard-accent2" />
            }
          ]}
        />

        {/* Monthly Chart */}
        <MonthlyChart />
      </div>
    </>
  );
};

export default DashboardView;