
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/utils/auditLogger";
import type { EmailStatus } from "@/components/reset-password/types";

export const useEmailStatus = () => {
  const { toast } = useToast();

  const checkEmailStatus = async (memberNum: string) => {
    try {
      console.log("Checking email status for member:", memberNum);
      
      const { data, error } = await supabase.rpc(
        'get_member_email_status',
        { p_member_number: memberNum }
      );

      if (error) {
        console.error("RPC error during email status check:", error);
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNum,
          severity: 'error',
          metadata: { 
            error: error.message, 
            step: 'check_email_status',
            event_type: 'email_status_check_failed'
          }
        });
        throw error;
      }

      if (!data) {
        console.error("No data returned from email status check");
        throw new Error('No data returned');
      }

      const typedData = (data as unknown) as EmailStatus;
      if (!('success' in typedData)) {
        console.error("Invalid response format:", data);
        throw new Error('Invalid response format');
      }
      
      console.log("Email status check result:", typedData);
      await logAuditEvent({
        operation: 'update',
        tableName: 'password_reset',
        recordId: memberNum,
        severity: 'info',
        metadata: { 
          step: 'check_email_status',
          status: 'success',
          is_temp_email: typedData.is_temp_email,
          event_type: 'email_status_check_success'
        }
      });

      return typedData;
    } catch (error: any) {
      console.error('Email status check error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to check email status",
      });
      return null;
    }
  };

  return { checkEmailStatus };
};
