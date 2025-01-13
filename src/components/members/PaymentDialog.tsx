import { useState } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import PaymentTypeSelector from "./payment/PaymentTypeSelector";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import BankDetails from "./payment/BankDetails";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberNumber: string;
  memberName: string;
  collectorInfo: { name: string | null; phone: string | null; prefix: string; number: string } | null;
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  memberId, 
  memberNumber, 
  memberName, 
  collectorInfo 
}: PaymentDialogProps) => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const queryClient = useQueryClient();
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('yearly');
  const [paymentAmount, setPaymentAmount] = useState<string>('40');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const handlePaymentTypeChange = (value: string) => {
    setSelectedPaymentType(value);
    if (value === 'yearly') {
      setPaymentAmount('40');
    } else {
      setPaymentAmount('');
    }
  };

  const createPaymentRequest = useMutation({
    mutationFn: async ({ 
      memberId, 
      memberNumber, 
      amount, 
      paymentType, 
      paymentMethod,
      collectorId 
    }: {
      memberId: string;
      memberNumber: string;
      amount: number;
      paymentType: string;
      paymentMethod: 'cash' | 'bank_transfer';
      collectorId: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          member_id: memberId,
          member_number: memberNumber,
          amount,
          payment_type: paymentType,
          payment_method: paymentMethod,
          collector_id: collectorId,
          status: 'pending'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setPaymentStatus('success');
      toast({
        title: "Payment request created",
        description: "An admin will review and approve the payment.",
      });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setTimeout(() => {
        setShowConfirmation(false);
        setPaymentStatus('pending');
        onClose();
      }, 2000);
    },
    onError: (error) => {
      setPaymentStatus('error');
      toast({
        title: "Error creating payment request",
        description: error.message,
        variant: "destructive",
      });
      setTimeout(() => {
        setPaymentStatus('pending');
        setShowConfirmation(false);
      }, 2000);
    }
  });

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || !collectorInfo?.name) return;

    const { data: collectorData } = await supabase
      .from('members_collectors')
      .select('id')
      .eq('name', collectorInfo.name)
      .single();

    if (!collectorData?.id) {
      toast({
        title: "Error",
        description: "Collector information not found",
        variant: "destructive",
      });
      return;
    }

    createPaymentRequest.mutate({
      memberId,
      memberNumber,
      amount: parseFloat(paymentAmount),
      paymentType: selectedPaymentType,
      paymentMethod,
      collectorId: collectorData.id
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-dashboard-card border-dashboard-accent1/20">
          <DialogHeader>
            <DialogTitle className="text-dashboard-accent2">
              Record Payment for {memberName}
              <span className="text-dashboard-accent1 text-sm ml-2">#{memberNumber}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <PaymentTypeSelector
              selectedPaymentType={selectedPaymentType}
              onPaymentTypeChange={handlePaymentTypeChange}
            />
            
            <div>
              <label className="text-sm font-medium mb-3 block text-dashboard-text">Amount</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="border-dashboard-accent1/20 bg-dashboard-dark h-12 text-lg"
                readOnly={selectedPaymentType === 'yearly'}
                disabled={userRole === 'member'}
              />
            </div>
            
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />

            {paymentMethod === 'bank_transfer' && (
              <BankDetails 
                collectorPrefix={collectorInfo?.prefix}
                collectorNumber={collectorInfo?.number}
              />
            )}
            
            <Button 
              className="w-full bg-dashboard-accent2 hover:bg-dashboard-accent2/80 text-white h-12 text-lg font-medium"
              onClick={() => setShowConfirmation(true)}
              disabled={userRole === 'member' || !paymentAmount || createPaymentRequest.isPending}
            >
              {userRole === 'member' 
                ? `Contact ${collectorInfo?.name || 'Collector'} for Payments` 
                : 'Submit Payment Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-dashboard-card border-dashboard-accent1/20">
          {paymentStatus === 'pending' ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-dashboard-accent1 text-xl">
                  Confirm Payment Request
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <div className="bg-dashboard-cardHover p-4 rounded-lg">
                    <p className="text-dashboard-text text-lg mb-2">
                      Member: <span className="text-dashboard-accent1 font-medium">{memberName}</span>
                    </p>
                    <p className="text-dashboard-text text-lg mb-2">
                      Member #: <span className="text-dashboard-accent2 font-mono">{memberNumber}</span>
                    </p>
                    <p className="text-dashboard-text text-lg">
                      Amount: <span className="text-dashboard-accent1 font-medium">${paymentAmount}</span>
                    </p>
                    <p className="text-dashboard-text text-lg">
                      Payment Type: <span className="text-dashboard-accent1 font-medium capitalize">{selectedPaymentType}</span>
                    </p>
                    <p className="text-dashboard-text text-lg">
                      Method: <span className="text-dashboard-accent1 font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <p className="text-dashboard-muted">
                    Please confirm that you want to submit this payment request.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-dashboard-dark text-dashboard-text hover:bg-dashboard-cardHover">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePaymentSubmit}
                  className="bg-dashboard-accent2 hover:bg-dashboard-accent2/80 text-white"
                >
                  Confirm Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <div className="p-6 text-center">
              {paymentStatus === 'success' ? (
                <div className="space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-dashboard-accent1">Payment Request Successful</h3>
                  <p className="text-dashboard-text">Your payment request has been submitted successfully.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-dashboard-accent1">Payment Request Failed</h3>
                  <p className="text-dashboard-text">There was an error submitting your payment request.</p>
                </div>
              )}
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaymentDialog;
