import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full Name is required")
    .min(3, "Name must be at least 3 characters long"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9]{10,15}$/.test(val.replace(/[\s-]/g, "")),
      "Please enter a valid phone number (10-15 digits)"
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  otp: z
    .string()
    .trim()
    .min(1, "OTP is required")
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain numbers only"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    otp: z
      .string()
      .trim()
      .min(1, "OTP is required")
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain numbers only"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Formats Zod validation errors into a key-value pair object (e.g., { email: "Invalid email" })
 */
export const formatZodErrors = (zodError) => {
  const formatted = {};
  const issues = zodError?.issues || zodError?.errors || [];
  issues.forEach((issue) => {
    const path = issue.path[0];
    if (path && !formatted[path]) {
      formatted[path] = issue.message;
    }
  });
  return formatted;
};

/**
 * Validates a single field using a Zod schema
 */
export const validateFieldWithZod = (schema, fieldName, value) => {
  const fieldSchema = schema.shape[fieldName];
  if (!fieldSchema) return "";
  const result = fieldSchema.safeParse(value);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    return issues[0]?.message || "Invalid value";
  }
  return "";
};
