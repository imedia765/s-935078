
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateReceipt, saveReceiptToStorage } from "@/utils/receiptGenerator";
import { sendPaymentNotification } from "@/utils/emailNotifications";
import { validatePayment } from "@/utils/financialValidation";
import { logFinancialEvent, validateFinancialAccess } from "@/utils/financialAuditLogger";
import type { Payment } from "../types";

export function useFinancialMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Validate access rights first
      const hasAccess = await validateFinancialAccess('approve', 'admin');
      if (!hasAccess) {
        throw new Error('Unauthorized: Insufficient permissions to approve payments');
      }

      // Fetch payment data first
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          members!payment_requests_member_id_fkey (
            full_name,
            email
          ),
          members_collectors!payment_requests_collector_id_fkey (
            id,
            name
          )
        `)
        .eq('id', paymentId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!paymentData) throw new Error('Payment not found');

      // Validate payment data
      const validation = validatePayment(paymentData);
      if (!validation.valid) {
        throw new Error(`Invalid payment data: ${validation.error}`);
      }

      // Approve the payment
      const { data: approvedPayment, error: approvalError } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', paymentId)
        .select()
        .single();
      
      if (approvalError) throw approvalError;

      // Log the approval
      await logFinancialEvent('approve', paymentData, {
        approved_at: new Date().toISOString(),
        payment_id: paymentId
      });

      const payment = approvedPayment as unknown as Payment;

      // Generate and store receipt
      const receiptBlob = await generateReceipt(payment);
      const receiptUrl = await saveReceiptToStorage(payment, receiptBlob);

      // Send confirmation email
      await sendPaymentNotification(payment, 'confirmation');

      return { payment, receiptUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Payment approved",
        description: "The payment has been successfully approved and notifications sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve payment: " + error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Validate access rights first
      const hasAccess = await validateFinancialAccess('delete', 'admin');
      if (!hasAccess) {
        throw new Error('Unauthorized: Insufficient permissions to delete payments');
      }

      // Fetch payment data before deletion for audit log
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Log deletion attempt before actual deletion
      await logFinancialEvent('delete', paymentData, {
        deleted_at: new Date().toISOString(),
        payment_id: paymentId
      });

      const { error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Payment deleted",
        description: "The payment has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment: " + error.message,
      });
    },
  });

  return {
    approveMutation,
    deleteMutation
  };
}
