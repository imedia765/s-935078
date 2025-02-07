
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
  members?: {
    full_name: string;
    email: string;
  };
  members_collectors?: {
    id: string;
    name: string;
  };
}

export interface CollectorMember {
  member_number: string;
  full_name: string;
  email: string;
}

export interface Collector {
  id: string;
  name: string;
  number: string;
  email: string;
  phone?: string;
  active: boolean;
  auth_user_id?: string;
  created_at?: string;
  member_number?: string;
  prefix?: string;
  updated_at?: string;
  members: CollectorMember;
  payment_requests?: Payment[];
}
