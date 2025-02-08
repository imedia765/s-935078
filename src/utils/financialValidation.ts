
import { z } from "zod";

export const PaymentSchema = z.object({
  amount: z.number()
    .positive("Amount must be greater than 0")
    .max(100000, "Amount exceeds maximum allowed"),
  payment_method: z.enum(["cash", "bank_transfer"], {
    required_error: "Payment method is required",
  }),
  payment_type: z.string().min(1, "Payment type is required"),
  member_number: z.string().min(1, "Member number is required"),
  collector_id: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentValidation = z.infer<typeof PaymentSchema>;

export const validatePayment = (data: unknown) => {
  try {
    const result = PaymentSchema.parse(data);
    return { valid: true, data: result, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, data: null, error: error.errors[0].message };
    }
    return { valid: false, data: null, error: "Invalid payment data" };
  }
};
