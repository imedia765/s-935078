
export interface PaymentStats {
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

export interface CollectorPaymentStats {
  [key: string]: {
    totalAmount: number;
    payments: any[];
    pendingCount: number;
    approvedCount: number;
  };
}

export interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  receipt_url: string;
  generated_at: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: 'bank_transfer' | 'cash';
  payment_type: string;
  status: string;
  created_at: string;
  payment_number: string;
  receipt_url?: string;
  collector_id?: string;
  member_id?: string;
  member_number?: string;
  notes?: string;
  approved_at?: string;
  approved_by?: string;
  due_date?: string;
  has_supporting_docs?: boolean;
  receipt_metadata?: Record<string, any>;
  receipts?: Receipt[];
  members?: {
    full_name: string;
    email: string;
  };
  members_collectors?: {
    id: string;
    name: string;
  };
}

