import { interpretSituation } from './llmService';

describe('LLM Preference Interpretation Service', () => {
  it('should interpret action movie preferences', async () => {
    const situation = 'I want to watch an exciting action movie with lots of fight scenes';
    const preferences = await interpretSituation(situation);

    expect(preferences.genrePreferences).toContain('Action');
    expect(preferences.genrePreferences).toContain('Adventure');
    expect(preferences.mood).toBe('energetic');
    expect(preferences.themes).toContain('exciting');
    expect(preferences.pace).toBe('fast');
  });

  it('should interpret romantic comedy preferences', async () => {
    const situation = 'Looking for a funny romantic movie to watch on date night';
    const preferences = await interpretSituation(situation);

    expect(preferences.genrePreferences).toContain('Comedy');
    expect(preferences.genrePreferences).toContain('Romance');
    expect(preferences.mood).toBe('romantic');
    expect(preferences.desiredExperience).toBe('romance');
  });

  it('should handle content to avoid', async () => {
    const situation = 'I want to watch a movie but nothing too violent or scary';
    const preferences = await interpretSituation(situation);

    expect(preferences.contentToAvoid).toContain('violence');
    expect(preferences.contentToAvoid).toContain('scary');
  });

  it('should handle runtime constraints', async () => {
    const situation = 'I want to watch a short movie under 90 minutes';
    const preferences = await interpretSituation(situation);

    expect(preferences.constraints.maxRuntimeMinutes).toBe(90);
  });

  it('should default to drama when no genres detected', async () => {
    const situation = 'I want to watch something interesting';
    const preferences = await interpretSituation(situation);

    expect(preferences.genrePreferences).toContain('Drama');
  });

  it('should return valid preferences object structure', async () => {
    const situation = 'Test situation';
    const preferences = await interpretSituation(situation);

    // Check that all required fields are present
    expect(preferences).toHaveProperty('genrePreferences');
    expect(preferences).toHaveProperty('mood');
    expect(preferences).toHaveProperty('themes');
    expect(preferences).toHaveProperty('pace');
    expect(preferences).toHaveProperty('contentToAvoid');
    expect(preferences).toHaveProperty('desiredExperience');
    expect(preferences).toHaveProperty('intensity');
    expect(preferences).toHaveProperty('constraints');

    // Check types
    expect(Array.isArray(preferences.genrePreferences)).toBe(true);
    expect(typeof preferences.mood === 'string' || preferences.mood === null).toBe(true);
    expect(Array.isArray(preferences.themes)).toBe(true);
    expect(typeof preferences.pace === 'string' || preferences.pace === null).toBe(true);
    expect(Array.isArray(preferences.contentToAvoid)).toBe(true);
    expect(typeof preferences.desiredExperience === 'string' || preferences.desiredExperience === null).toBe(true);
    expect(typeof preferences.intensity === 'string' || preferences.intensity === null).toBe(true);
    expect(typeof preferences.constraints === 'object').toBe(true);
  });

  it('should not add duplicate genres', async () => {
    const situation = 'I want to watch action and adventure movies';
    const preferences = await interpretSituation(situation);

    // Action and Adventure both map to the same genres, so we should still have only 2 unique genres
    expect(preferences.genrePreferences.length).toBe(2);
    expect(preferences.genrePreferences).toContain('Action');
    expect(preferences.genrePreferences).toContain('Adventure');
  });
});