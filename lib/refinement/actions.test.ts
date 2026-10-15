import { applyRefinementAction, RefinementAction } from './actions';
import { InterpretedPreferences } from '../schemas/preferences';

describe('Refinement Actions System', () => {
  const basePreferences: InterpretedPreferences = {
    genrePreferences: ['Action', 'Drama'],
    mood: 'thoughtful',
    themes: ['redemption', 'journey'],
    pace: 'moderate',
    contentToAvoid: ['violence'],
    desiredExperience: 'inspiration',
    intensity: 'medium',
    constraints: {
      excludeAdultContent: true
    }
  };

  it('should set desired experience', () => {
    const action: RefinementAction = { type: 'SET_DESIRED_EXPERIENCE', experience: 'relaxation' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.desiredExperience).toBe('relaxation');
    // Other fields should remain unchanged
    expect(result.mood).toBe(basePreferences.mood);
    expect(result.themes).toEqual(basePreferences.themes);
  });

  it('should set mood', () => {
    const action: RefinementAction = { type: 'SET_MOOD', mood: 'energetic' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.mood).toBe('energetic');
    // Other fields should remain unchanged
    expect(result.desiredExperience).toBe(basePreferences.desiredExperience);
    expect(result.intensity).toBe(basePreferences.intensity);
  });

  it('should set intensity', () => {
    const action: RefinementAction = { type: 'SET_INTENSITY', intensity: 'high' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.intensity).toBe('high');
    // Other fields should remain unchanged
    expect(result.mood).toBe(basePreferences.mood);
    expect(result.desiredExperience).toBe(basePreferences.desiredExperience);
  });

  it('should add theme when it does not exist', () => {
    const action: RefinementAction = { type: 'ADD_THEME', theme: 'love' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.themes).toContain('love');
    expect(result.themes.length).toBe(basePreferences.themes.length + 1);
    // Original themes should still be there
    expect(result.themes).toContain('redemption');
    expect(result.themes).toContain('journey');
  });

  it('should not add duplicate theme', () => {
    const action: RefinementAction = { type: 'ADD_THEME', theme: 'Redemption' }; // Case difference
    const result = applyRefinementAction(basePreferences, action);

    // Should not add duplicate (case insensitive)
    const redemptionCount = result.themes.filter(t => t.toLowerCase() === 'redemption').length;
    expect(redemptionCount).toBe(1);
    expect(result.themes.length).toBe(basePreferences.themes.length);
  });

  it('should add content to avoid when it does not exist', () => {
    const action: RefinementAction = { type: 'ADD_CONTENT_TO_AVOID', content: 'horror' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.contentToAvoid).toContain('horror');
    expect(result.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length + 1);
    // Original content should still be there
    expect(result.contentToAvoid).toContain('violence');
  });

  it('should not add duplicate content to avoid', () => {
    const action: RefinementAction = { type: 'ADD_CONTENT_TO_AVOID', content: 'Violence' }; // Case difference
    const result = applyRefinementAction(basePreferences, action);

    // Should not add duplicate (case insensitive)
    const violenceCount = result.contentToAvoid.filter(c => c.toLowerCase() === 'violence').length;
    expect(violenceCount).toBe(1);
    expect(result.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length);
  });

  it('should remove content to avoid', () => {
    const action: RefinementAction = { type: 'REMOVE_CONTENT_TO_AVOID', content: 'violence' };
    const result = applyRefinementAction(basePreferences, action);

    expect(result.contentToAvoid).not.toContain('violence');
    expect(result.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length - 1);
  });

  it('should not fail when removing non-existent content to avoid', () => {
    const action: RefinementAction = { type: 'REMOVE_CONTENT_TO_AVOID', content: 'nonexistent' };
    const result = applyRefinementAction(basePreferences, action);

    // Should remain unchanged
    expect(result.contentToAvoid).toEqual(basePreferences.contentToAvoid);
  });

  it('should reset preferences to default state', () => {
    const action: RefinementAction = { type: 'RESET' };
    const result = applyRefinementAction(basePreferences, action);

    // Required fields should remain
    expect(result.genrePreferences).toEqual(basePreferences.genrePreferences);
    expect(result.constraints).toEqual(basePreferences.constraints);

    // Optional fields should be reset to defaults
    expect(result.mood).toBeNull();
    expect(result.themes).toEqual([]);
    expect(result.pace).toBeNull();
    expect(result.contentToAvoid).toEqual([]);
    expect(result.desiredExperience).toBeNull();
    expect(result.intensity).toBeNull();
  });
});