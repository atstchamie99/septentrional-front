// ============================================================================
// EXPORT CENTRALISÉ DE TOUS LES SCHÉMAS DE VALIDATION
// ============================================================================

// Réexporter tous les schémas depuis les fichiers dédiés
export * from './schemas';
export * from './auth';

// ============================================================================
// SCHÉMAS SUPPLÉMENTAIRES POUR LES FORMULAIRES
// ============================================================================

import { z } from 'zod';

// Schéma pour la création/mise à jour d'un article
export const articleSchema = z.object({
  titre: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  contenu: z.string().min(1),
  extrait: z.string().max(500).optional(),
  categorie_id: z.number().int().positive().optional(),
  statut: z.enum(['brouillon', 'publie', 'archive']).default('brouillon'),
  image_principale: z.instanceof(File).optional(),
  etiquette_ids: z.array(z.number().int().positive()).optional(),
  date_publication: z.string().datetime().optional(),
  est_alerte: z.boolean().optional().default(false),
});



// Schéma pour la création/mise à jour d'une vidéo
export const videoSchema = z.object({
  titre: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  url: z.string().url().max(2048),
  categorie_id: z.number().int().positive().optional(),
  statut: z.enum(['brouillon', 'publie', 'archive']).default('brouillon'),
  image: z.string().url().optional(),
  duree: z.number().int().positive().optional(),
  date_publication: z.string().datetime().optional(),
  nombre_vues: z.number().int().nonnegative().optional().default(0),
});

// Schéma pour la création/mise à jour d'une catégorie
export const categorieSchema = z.object({
  titre: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  parent_id: z.number().int().positive().optional(),
});

// Schéma pour la création/mise à jour d'un utilisateur (admin)
export const userSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(255).optional(),
  password_confirmation: z.string().min(8).max(255).optional(),
  role: z.enum(['admin', 'redacteur', 'user']),
  is_active: z.boolean().optional().default(true),
  avatar: z.instanceof(File).optional(),
});

// Schéma pour les paramètres de filtre des listes
export const listFiltersSchema = z.object({
  categorie: z.string().max(255).optional(),
  etiquette: z.string().max(255).optional(),
  statut: z.string().max(50).optional(),
  alertes: z.boolean().optional(),
});

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type ArticleData = z.infer<typeof articleSchema>;
export type VideoData = z.infer<typeof videoSchema>;
export type CategorieData = z.infer<typeof categorieSchema>;
export type UserData = z.infer<typeof userSchema>;
export type ListFilters = z.infer<typeof listFiltersSchema>;
