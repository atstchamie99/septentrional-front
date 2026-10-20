import { z } from 'zod';
import { emailSchema } from './schemas';

// ============================================================================
// SCHÉMAS D'AUTHENTIFICATION
// ============================================================================

// Schéma pour la requête de login
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(255), // Minimum 8 caractères pour la sécurité
  device: z.string().max(255).optional(),
});

// Schéma pour la réponse de login (sans token, géré par cookies)
export const loginResponseSchema = z.object({
  user: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(255),
    email: emailSchema,
    role: z.enum(['admin', 'redacteur', 'user']),
    avatar: z.string().url().nullable().optional(),
  }),
});

// Schéma pour le challenge OTP
export const otpChallengeSchema = z.object({
  requires_otp: z.literal(true),
  otp_setup_required: z.boolean(),
  otp_method: z.enum(['email', 'authenticator']).optional(),
  expires_in: z.number().optional(),
  challenge_token: z.string().min(1).max(255),
  otp_secret: z.string().optional(),
  otp_qr_svg: z.string().optional(),
});

// Schéma pour la requête de vérification OTP
export const verifyOtpRequestSchema = z.object({
  challenge_token: z.string().min(1).max(255),
  code: z.string().min(6).max(6), // Code OTP à 6 chiffres
  device: z.string().max(255).optional(),
});

// Schéma pour la réponse de vérification OTP (même que loginResponse)
export const verifyOtpResponseSchema = loginResponseSchema;

// Schéma pour le changement de mot de passe
export const changePasswordRequestSchema = z.object({
  current_password: z.string().min(8).max(255),
  password: z.string().min(8).max(255),
  password_confirmation: z.string().min(8).max(255),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

// Schéma pour la demande de réinitialisation de mot de passe
export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

// Schéma pour la réinitialisation de mot de passe
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1).max(255),
  email: emailSchema,
  password: z.string().min(8).max(255),
  password_confirmation: z.string().min(8).max(255),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

// ============================================================================
// TYPES TYPESCRIPT GÉNÉRÉS À PARTIR DES SCHÉMAS
// ============================================================================

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type OtpChallenge = z.infer<typeof otpChallengeSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
