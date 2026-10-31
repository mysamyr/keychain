import { z } from 'zod/v4';

/** Every stored or compared address is trimmed and lower-cased. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Schemas for requests
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1),
});

export const confirmEmailChangeSchema = z.object({
  token: z.string().trim().min(1),
});

export const cancelEmailChangeSchema = z.object({
  expectedEmail: emailSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

export const confirmPasswordSchema = z.object({
  password: z.string().min(1),
});

export const sensitiveActionSchema = z.object({
  password: z.string().optional(),
});
export type SensitiveActionDTO = z.input<typeof sensitiveActionSchema>;

export const updateProfileSchema = z.object({
  email: emailSchema.optional(),
  password: z.string().min(1),
});

export const reauthenticationSchema = z.object({
  action: z.enum(['delete-account', 'set-password']),
});
export type ReauthenticationDTO = z.input<typeof reauthenticationSchema>;
export type ReauthenticationAction = ReauthenticationDTO['action'];
export const verifyReauthenticationSchema = reauthenticationSchema.extend({
  code: z.string().regex(/^\d{8}$/),
});
export type VerifyReauthenticationDTO = z.input<
  typeof verifyReauthenticationSchema
>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyResetTokenSchema = z.object({
  token: z.string().trim().min(1),
});

export const resetPasswordSchema = z.object({
  token: verifyResetTokenSchema.shape.token,
  password: z.string().min(8),
});

// Schemas for models/responses
export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  isEmailVerified: z.boolean(),
  hasPassword: z.boolean(),
  hasGoogleAccount: z.boolean(),
  canLinkGoogle: z.boolean(),
  pendingEmail: z.string().nullable().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sessionSchema = z.object({
  id: z.string(),
  userAgent: z.string(),
  ip: z.string(),
  createdAt: z.string(),
  isCurrent: z.boolean(),
});

export const authResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  isEmailVerified: z.boolean(),
});

export const registerResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
});

// Output DTO types
export type LoginDTO = z.input<typeof loginSchema>;
export type RegisterDTO = z.input<typeof registerSchema>;
export type VerifyEmailDTO = z.input<typeof verifyEmailSchema>;
export type ConfirmEmailChangeDTO = z.input<typeof confirmEmailChangeSchema>;
export type CancelEmailChangeDTO = z.input<typeof cancelEmailChangeSchema>;
export type ResendVerificationDTO = z.input<typeof resendVerificationSchema>;
export type ConfirmPasswordDTO = z.input<typeof confirmPasswordSchema>;
export type ChangePasswordDTO = z.input<typeof changePasswordSchema>;
export type UpdateProfileDTO = z.input<typeof updateProfileSchema>;
export type ForgotPasswordDTO = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.input<typeof resetPasswordSchema>;
export type VerifyResetTokenDTO = z.input<typeof verifyResetTokenSchema>;

export type UserDTO = z.output<typeof userSchema>;
export type SessionDTO = z.output<typeof sessionSchema>;
export type AuthResponseDTO = z.output<typeof authResponseSchema>;
export type RegisterResponseDTO = z.output<typeof registerResponseSchema>;
