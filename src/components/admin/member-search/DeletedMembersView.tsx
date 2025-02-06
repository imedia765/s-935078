import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function DeletedMembersView() {
  const { toast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: deletedMembers, isLoading } = useQuery({
    queryKey: ["deletedMembers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deleted_members')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleRestore = async (id: string, memberData: any) => {
    try {
      setIsRestoring(true);
      
      // Insert the member back into the members table
      const { error: insertError } = await supabase
        .from('members')
        .insert(memberData);

      if (insertError) throw insertError;

      // Update the deleted_members record
      const { error: updateError } = await supabase
        .from('deleted_members')
        .update({
          restored_at: new Date().toISOString(),
          restored_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Member Restored",
        description: `${memberData.full_name} has been restored successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) return <div>Loading deleted members...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Deleted Members</h2>
      </div>

      {deletedMembers && deletedMembers.length > 0 ? (
        <div className="space-y-4">
          {deletedMembers.map((record: any) => (
            <Card key={record.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{record.member_data.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Member ID: {record.member_data.member_number}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      Deleted: {new Date(record.deleted_at).toLocaleString()}
                    </p>
                    {record.restored_at && (
                      <Badge variant="secondary">
                        Restored: {new Date(record.restored_at).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                {!record.restored_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(record.id, record.member_data)}
                    disabled={isRestoring}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore Member
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No deleted members found.</p>
      )}
    </div>
  );
}