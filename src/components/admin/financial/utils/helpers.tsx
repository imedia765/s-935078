
import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  approvedPayments: number;
  paymentMethods: {
    cash: number;
    bankTransfer: number;
  };
  recentPayments: any[];
}

export const getPaymentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-500/20 text-green-400';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'rejected':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const getPaymentStatusIcon = (status: string): JSX.Element => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircle className="mr-1 h-4 w-4" />;
    case 'rejected':
      return <XCircle className="mr-1 h-4 w-4" />;
    default:
      return <AlertCircle className="mr-1 h-4 w-4" />;
  }
};

export const formatMemberNumber = (collector: { members?: { member_number?: string } }, index: number): string => {
  return collector.members?.member_number || `M${String(index + 1).padStart(4, '0')}`;
};

export const calculatePaymentStats = (payments: any[] | null | undefined): PaymentStats | null => {
  if (!payments) return null;

  console.log('Calculating payment stats for:', payments.length, 'payments');

  const stats: PaymentStats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    approvedPayments: payments.filter(p => p.status === 'approved').length,
    paymentMethods: {
      cash: payments.filter(p => p.payment_method === 'cash').length,
      bankTransfer: payments.filter(p => p.payment_method === 'bank_transfer').length,
    },
    recentPayments: payments
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  };

  console.log('Calculated payment stats:', stats);
  return stats;
};
