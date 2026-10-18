import { z } from 'zod';

// Controlled values for inferred preferences
export const Pace = ['slow', 'medium', 'fast', 'moderate'] as const;
export type Pace = typeof Pace[number];

export const Intensity = ['low', 'medium', 'high'] as const;
export type Intensity = typeof Intensity[number];

export const Mood = [
  'happy',
  'sad',
  'hopeful',
  'melancholic',
  'energetic',
  'relaxed',
  'thoughtful',
  'romantic',
  'scary',
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
  'escapism',
  'education',
  'relaxation',
  'romance'
] as const;
export type DesiredExperience = typeof DesiredExperience[number];

export const InterpretedPreferences = z.object({
  situationSummary: z.string().max(240).optional(),
  genrePreferences: z.array(z.string()).min(1, 'At least one genre preference is required'),
  storySignals: z.array(z.string()).optional(),
  storyKeywords: z.array(z.string()).optional(),
  storyReferences: z.array(z.string()).optional(),
  mood: z.union([z.enum(Mood), z.null()]).nullish(),
  themes: z.array(z.string()),
  pace: z.union([z.enum(Pace), z.null()]).nullish(),
  contentToAvoid: z.array(z.string()),
  desiredExperience: z.union([z.enum(DesiredExperience), z.null()]).nullish(),
  intensity: z.union([z.enum(Intensity), z.null()]).nullish(),
  constraints: z.object({
    excludeAdultContent: z.boolean(),
    maxRuntimeMinutes: z.number().int().positive().optional(),
    releaseYearFrom: z.number().int().optional(),
    releaseYearTo: z.number().int().optional()
  })
});

export type InterpretedPreferences = z.infer<typeof InterpretedPreferences>;
export type InterpretedPreferencesType = InterpretedPreferences;
