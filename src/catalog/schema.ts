import { z } from 'zod';

export const lightSchema = z.enum(['low', 'medium', 'bright_indirect', 'direct']);
export const levelSchema = z.enum(['low', 'medium', 'high']);
export const categorySchema = z.enum([
  'foliage',
  'succulent',
  'flowering',
  'palm',
  'fern',
  'carnivorous',
  'edible',
]);

export const catalogPlantSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['active', 'retired']),
  latin_name: z.string().min(1),
  /** Former or trade latin names still in common use (e.g. « Saintpaulia ionantha »). */
  synonyms: z.array(z.string()),
  common_names_fr: z.array(z.string()),
  common_names_en: z.array(z.string()),
  family: z.string(),
  category: categorySchema,
  light: lightSchema,
  water_every_days_summer: z.number().int().positive(),
  water_every_days_winter: z.number().int().positive(),
  water_notes_fr: z.string(),
  humidity: levelSchema,
  temp_min_c: z.number().int().min(-10).max(30),
  temp_max_c: z.number().int().min(10).max(45),
  soil_fr: z.string(),
  fertilize_fr: z.string(),
  fertilize_every_days: z.number().int().positive().nullable(),
  repot_every_years: z.number().int().positive().nullable(),
  pet_toxic: z.enum(['yes', 'no', 'unknown']),
  pet_toxic_note_fr: z.string().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tips_fr: z.string(),
  problems: z.array(z.object({ symptom_fr: z.string(), cause_fr: z.string(), fix_fr: z.string() })),
  data_status: z.enum(['draft', 'reviewed']),
  sources: z.array(
    z.object({
      name: z.string(),
      url: z.string().url().optional(),
      license: z.string().optional(),
    }),
  ),
  photos: z.array(
    z.object({
      file: z.string(),
      author: z.string(),
      license: z.string(),
      source_url: z.string().url(),
    }),
  ),
});

export const catalogFileSchema = z.object({
  version: z.number().int(),
  plants: z.array(catalogPlantSchema),
});

export type CatalogPlant = z.infer<typeof catalogPlantSchema>;
export type Light = z.infer<typeof lightSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Category = z.infer<typeof categorySchema>;
