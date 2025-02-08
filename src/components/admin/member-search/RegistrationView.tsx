
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Calendar, CheckCircle, XCircle } from "lucide-react";

export function RegistrationView() {
  const { toast } = useToast();
  const [loadingMemberIds, setLoadingMemberIds] = useState<Set<string>>(new Set());

  const { data: registrations, isLoading, refetch } = useQuery({
    queryKey: ["registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleVerify = async (memberId: string) => {
    try {
      setLoadingMemberIds(prev => new Set(prev).add(memberId));
      
      const { error } = await supabase
        .from('members')
        .update({ 
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member registration verified successfully",
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMemberIds(prev => {
        const updated = new Set(prev);
        updated.delete(memberId);
        return updated;
      });
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      setLoadingMemberIds(prev => new Set(prev).add(memberId));
      
      const { error } = await supabase
        .from('members')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member registration rejected",
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMemberIds(prev => {
        const updated = new Set(prev);
        updated.delete(memberId);
        return updated;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations?.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No pending registrations found
        </Card>
      ) : (
        registrations?.map((member) => (
          <Card key={member.id} className="p-6 glass-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{member.full_name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                  {member.phone && (
                    <>
                      <Phone className="w-4 h-4 ml-2" />
                      <span>{member.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant={member.status === 'active' ? 'secondary' : 'outline'}>
                {member.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member ID</p>
                <p>{member.member_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <p>{new Date(member.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {member.auth_user_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auth Status</p>
                  <Badge variant="outline">Account Created</Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-700"
                onClick={() => handleVerify(member.id)}
                disabled={loadingMemberIds.has(member.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-700"
                onClick={() => handleReject(member.id)}
                disabled={loadingMemberIds.has(member.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
