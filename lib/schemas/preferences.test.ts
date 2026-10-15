import { z } from 'zod';
import { InterpretedPreferences } from './preferences';

describe('InterpretedPreferences schema', () => {
  it('should validate a complete preference object', () => {
    const validInput = {
      genrePreferences: ['Action', 'Drama'],
      mood: 'hopeful',
      themes: ['friendship', 'overcoming adversity'],
      pace: 'medium',
      contentToAvoid: ['violence'],
      desiredExperience: 'inspiration',
      intensity: 'high',
      constraints: {
        excludeAdultContent: true,
        maxRuntimeMinutes: 120,
        releaseYearFrom: 2000,
        releaseYearTo: 2023
      }
    };

    // This will fail initially because the schema doesn't exist yet
    const result = InterpretedPreferences.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should allow null for optional fields', () => {
    const inputWithNulls = {
      genrePreferences: ['Comedy'],
      mood: null,
      themes: [],
      pace: null,
      contentToAvoid: [],
      desiredExperience: null,
      intensity: null,
      constraints: {
        excludeAdultContent: false
      }
    };

    const result = InterpretedPreferences.safeParse(inputWithNulls);
    expect(result.success).toBe(true);
  });
});