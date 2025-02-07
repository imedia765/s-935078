export interface MemberWithRelations {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string;
  failed_login_attempts: number | null;
  user_roles: Array<{ role: string }>;
  roles?: string[];  // Added for compatibility with existing code
  member_notes: Array<{ note_text: string; note_type: string }>;
  payment_requests: Array<{ status: string | null; amount: number; payment_type: string }>;
  status: string;
  date_of_birth: string | null;
  address: string | null;
  town: string | null;
  postcode: string | null;
  membership_type: string | null;
  payment_date: string | null;
  marital_status: string | null;
  gender: string | null;
  collector: string | null;
  photo_url: string | null;
  yearly_payment_status: string | null;
  yearly_payment_due_date: string | null;
  yearly_payment_amount: number | null;
  emergency_collection_status: string | null;
  emergency_collection_amount: number | null;
  emergency_collection_due_date: string | null;
  family_members: Array<{
    id: string;
    full_name: string;
    relationship: string;
    date_of_birth: string | null;
    gender: string | null;
  }>;
}

export interface ValidationRules {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  message: string;
}

export const memberValidationRules: Record<string, ValidationRules> = {
  email: {
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address'
  },
  phone: {
    pattern: /^(\+44|0)[0-9]{10}$/,
    message: 'Please enter a valid UK phone number (e.g., 07123456789)'
  },
  postcode: {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
    message: 'Please enter a valid UK postcode'
  },
  full_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Full name must be between 2 and 100 characters'
  },
  date_of_birth: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Please enter a valid date (YYYY-MM-DD)'
  }
};

export const validateField = (
  fieldName: string,
  value: string | null | undefined
): string | null => {
  if (!value && !memberValidationRules[fieldName]?.required) {
    return null;
  }

  const rules = memberValidationRules[fieldName];
  if (!rules) return null;

  if (rules.required && !value) {
    return rules.message;
  }

  if (value) {
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    if (rules.minLength && value.length < rules.minLength) {
      return rules.message;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message;
    }
  }

  return null;
};
