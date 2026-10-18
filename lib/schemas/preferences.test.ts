import { InterpretedPreferences } from './preferences';

describe('InterpretedPreferences schema', () => {
  it('accepts interpreted story signals and viewing preferences', () => {
    const validInput = {
      situationSummary: 'You want a hopeful story about finding connection after a major life change.',
      genrePreferences: ['Action', 'Drama'],
      storySignals: ['life-transition', 'unexpected-connection'],
      storyKeywords: ['finding direction after college', 'new friendship'],
      storyReferences: ['The Graduate'],
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
