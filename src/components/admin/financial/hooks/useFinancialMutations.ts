
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { generateReceipt, saveReceiptToStorage } from "@/utils/receiptGenerator";
import { sendPaymentNotification } from "@/utils/emailNotifications";
import type { Payment } from "../types";

export function useFinancialMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // First approve the payment
      const { data: paymentData, error: approvalError } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', paymentId)
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
        .single();
      
      if (approvalError) throw approvalError;
      if (!paymentData) throw new Error('No payment data returned');

      const payment = paymentData as unknown as Payment;

      // Generate and store receipt
      const receiptBlob = await generateReceipt(payment);
      const receiptUrl = await saveReceiptToStorage(paymentId, receiptBlob);

      // Update payment with receipt URL
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ receipt_url: receiptUrl })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Send confirmation email
      await sendPaymentNotification(payment, 'confirmation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Payment approved",
        description: "The payment has been successfully approved and receipt sent.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve payment: " + error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
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
