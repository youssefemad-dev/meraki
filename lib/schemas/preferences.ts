import { z } from 'zod';

// Controlled values for inferred preferences
export const Pace = ['slow', 'medium', 'fast'] as const;
export type Pace = typeof Pace[number];

export const Intensity = ['low', 'medium', 'high'] as const;
export type Intensity = typeof Intensity[number];

export const Mood = [
  'hopeful',
  'melancholic',
  'energetic',
  'peaceful',
  'nostalgic',
  'tense',
  'playful',
  'reflective'
] as const;
export type Mood = typeof Mood[number];

export const DesiredExperience = [
  'comfort',
  'distraction',
  'reflection',
  'inspiration',
  'excitement',
  'emotional-release',
  'escapism'
] as const;
export type DesiredExperience = typeof DesiredExperience[number];

export const InterpretedPreferences = z.object({
  genrePreferences: z.array(z.string()).min(1, 'At least one genre preference is required'),
  mood: z.union([z.enum(Mood as [string, ...string[]]), z.null()]).nullish(),
  themes: z.array(z.string()),
  pace: z.union([z.enum(Pace as [string, ...string[]]), z.null()]).nullish(),
  contentToAvoid: z.array(z.string()),
  desiredExperience: z.union([z.enum(DesiredExperience as [string, ...string[]]), z.null()]).nullish(),
  intensity: z.union([z.enum(Intensity as [string, ...string[]]), z.null()]).nullish(),
  constraints: z.object({
    excludeAdultContent: z.boolean(),
    maxRuntimeMinutes: z.number().int().positive().optional(),
    releaseYearFrom: z.number().int().optional(),
    releaseYearTo: z.number().int().optional()
  })
});

export type InterpretedPreferencesType = z.infer<typeof InterpretedPreferences>;