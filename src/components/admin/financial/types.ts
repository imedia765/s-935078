
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
  payment_method: string;
  payment_type: string;
  status: string;
  created_at: string;
  payment_number: string;
  members?: {
    full_name: string;
  };
  members_collectors?: {
    name: string;
  };
}

export interface Collector {
  id: string;
  name: string;
  number: string;
  email: string;
  phone?: string;
  active: boolean;
  members?: {
    id: string;
    full_name: string;
    payment_amount?: number;
    payment_date?: string;
    yearly_payment_amount?: number;
    yearly_payment_status?: string;
  }[];
  payment_requests?: Payment[];
}
