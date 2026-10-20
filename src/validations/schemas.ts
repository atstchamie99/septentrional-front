import { z } from 'zod';

// ============================================================================
// SCHÉMAS DE BASE RÉUTILISABLES
// ============================================================================

// Schéma pour les identifiants
export const idSchema = z.number().int().positive();
export const uuidSchema = z.string().uuid();

// Schéma pour les emails
export const emailSchema = z.string().email().max(255);

// Schéma pour les URLs
export const urlSchema = z.string().url().max(2048);

// Schéma pour les numéros de téléphone (format E.164)
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Format de téléphone invalide');

// Schéma pour les slugs
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide').max(255);

// ============================================================================
// SCHÉMAS DE PAGINATION ET TRI
// ============================================================================

// Schéma pour les paramètres de pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(12),
});

// Schéma pour les paramètres de tri
export const sortSchema = z.object({
  sort: z.string().max(255).optional(),
});

// Schéma pour les paramètres de recherche
export const searchSchema = z.object({
  q: z.string().max(255).optional(),
});

// Schéma complet pour les listes (recherche + tri + pagination)
export const listParamsSchema = z.object({
  q: z.string().max(255).optional(),
  sort: z.string().max(255).optional(),
  per_page: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

// ============================================================================
// SCHÉMAS DE CHAMPS COMMUNS
// ============================================================================

// Schéma pour les champs de base d'un modèle avec timestamps
export const baseModelSchema = z.object({
  id: idSchema,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Schéma pour les champs de base d'un utilisateur
export const baseUserSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(255),
  email: emailSchema,
  role: z.enum(['admin', 'redacteur', 'user']),
  avatar: z.string().url().nullable().optional(),
});

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Valide des données contre un schéma et retourne les données typées
 * @throws ZodError si la validation échoue
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Valide des données contre un schéma et retourne les données ou null
 * Ne lève pas d'erreur, retourne null si invalide
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Valide des données contre un schéma et retourne les erreurs
 */
export function validateWithErrors<T>(schema: z.ZodSchema<T>, data: unknown): {
  data: T | null;
  errors: z.ZodIssue[];
} {
  const result = schema.safeParse(data);
  return {
    data: result.success ? result.data : null,
    errors: result.success ? [] : result.error.issues,
  };
}

// ============================================================================
// EXPORT DES SCHÉMAS
// ============================================================================

export {
  idSchema as numberIdSchema,
  uuidSchema as stringUuidSchema,
  emailSchema as stringEmailSchema,
  urlSchema as stringUrlSchema,
  phoneSchema as stringPhoneSchema,
  slugSchema as stringSlugSchema,
};
