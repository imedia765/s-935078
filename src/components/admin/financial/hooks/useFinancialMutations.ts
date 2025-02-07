
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      const receiptUrl = await saveReceiptToStorage(payment, receiptBlob);

      // Create a new receipt record
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          payment_id: paymentId,
          receipt_number: `RCP-${Date.now()}`,
          receipt_url: receiptUrl,
          generated_at: new Date().toISOString()
        });

      if (receiptError) throw receiptError;

      // Send confirmation email
      await sendPaymentNotification(payment, 'confirmation');

      // If this is a late payment, also send a late notice
      if (payment.due_date) {
        const dueDate = new Date(payment.due_date);
        if (dueDate < new Date()) {
          const daysLate = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLate > 0) {
            await sendPaymentNotification(payment, 'late', { daysLate });
          }
        }
      }
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

