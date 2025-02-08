export interface MemberWithRelations {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string;
  failed_login_attempts: number | null;
  user_roles: Array<{ role: string }>;
  roles?: string[];  // Added for compatibility with existing code
  member_notes: Array<{ id: string; note_text: string; note_type: string }>;
  payment_requests: Array<{
    id: string;
    status: string | null;
    amount: number;
    payment_type: string;
    created_at: string | null;
    payment_number: string | null;
  }>;
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
  auth_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MemberFormData {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  member_number: string;
  status?: string;
  date_of_birth?: string | null;
  address?: string | null;
  town?: string | null;
  postcode?: string | null;
  membership_type?: string | null;
  payment_date?: string | null;
  marital_status?: string | null;
  gender?: string | null;
  collector_id?: string | null;
  photo_url?: string | null;
}

export interface ValidationRules {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  message: string;
  enum?: string[];
  minDate?: Date;
  maxDate?: Date;
}

export const memberValidationRules: Record<string, ValidationRules> = {
  email: {
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address'
  },
  phone: {
    pattern: /^(\+44|0)[0-9]{10}$/,
    message: 'Please enter a valid UK phone number (e.g., 07123456789 or +447123456789)'
  },
  postcode: {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
    message: 'Please enter a valid UK postcode'
  },
  full_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Full name must be between 2 and 100 characters and contain only letters, spaces, hyphens and apostrophes'
  },
  date_of_birth: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    minDate: new Date(1900, 0, 1),
    maxDate: new Date(),
    message: 'Please enter a valid date between 1900 and today'
  },
  address: {
    required: true,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s,'-]+$/,
    message: 'Address must not exceed 200 characters and contain only letters, numbers, spaces, commas, hyphens and apostrophes'
  },
  town: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Town must not exceed 100 characters and contain only letters, spaces, hyphens and apostrophes'
  },
  gender: {
    enum: ['male', 'female', 'other'],
    message: 'Please select a valid gender'
  },
  marital_status: {
    enum: ['single', 'married', 'divorced', 'widowed'],
    message: 'Please select a valid marital status'
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

    if (rules.enum && !rules.enum.includes(value)) {
      return rules.message;
    }

    if (fieldName === 'date_of_birth' && rules.minDate && rules.maxDate) {
      const date = new Date(value);
      if (date < rules.minDate || date > rules.maxDate) {
        return rules.message;
      }
    }
  }

  return null;
};

export const validateAllFields = (data: Partial<MemberWithRelations>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(memberValidationRules).forEach((field) => {
    const value = data[field as keyof MemberWithRelations];
    if (typeof value === 'string') {
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return errors;
};

export const getDisplayError = (fieldName: string, error: string | null): string => {
  if (!error) return '';
  return memberValidationRules[fieldName]?.message || error;
};
