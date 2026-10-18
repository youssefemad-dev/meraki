import { applyRefinementAction, RefinementAction } from '@/lib/refinement/actions';
import { InterpretedPreferences } from '@/lib/schemas/preferences';

// Mock the NextResponse for testing
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (data: any, options: { status?: number } = {}) => {
        return {
          json: () => Promise.resolve(data),
          status: options.status || 200
        };
      }
    }
  };
});

describe('Refinement API Route', () => {
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

  it('should set desired experience', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'SET_DESIRED_EXPERIENCE', experience: 'relaxation' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.desiredExperience).toBe('relaxation');
    expect(response.status).toBe(200);
  });

  it('should set mood', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'SET_MOOD', mood: 'energetic' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.mood).toBe('energetic');
    expect(response.status).toBe(200);
  });

  it('should set intensity', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'SET_INTENSITY', intensity: 'high' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.intensity).toBe('high');
    expect(response.status).toBe(200);
  });

  it('should add theme when it does not exist', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'ADD_THEME', theme: 'love' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.themes).toContain('love');
    expect(jsonData.preferences.themes.length).toBe(basePreferences.themes.length + 1);
    expect(response.status).toBe(200);
  });

  it('should not add duplicate theme', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'ADD_THEME', theme: 'Redemption' } // Case difference
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    // Should not add duplicate (case insensitive)
    const redemptionCount = jsonData.preferences.themes.filter((t: string) => t.toLowerCase() === 'redemption').length;
    expect(redemptionCount).toBe(1);
    expect(jsonData.preferences.themes.length).toBe(basePreferences.themes.length);
    expect(response.status).toBe(200);
  });

  it('should add content to avoid when it does not exist', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'ADD_CONTENT_TO_AVOID', content: 'horror' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.contentToAvoid).toContain('horror');
    expect(jsonData.preferences.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length + 1);
    expect(response.status).toBe(200);
  });

  it('should not add duplicate content to avoid', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'ADD_CONTENT_TO_AVOID', content: 'Violence' } // Case difference
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    // Should not add duplicate (case insensitive)
    const violenceCount = jsonData.preferences.contentToAvoid.filter((c: string) => c.toLowerCase() === 'violence').length;
    expect(violenceCount).toBe(1);
    expect(jsonData.preferences.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length);
    expect(response.status).toBe(200);
  });

  it('should remove content to avoid', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'REMOVE_CONTENT_TO_AVOID', content: 'violence' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.preferences.contentToAvoid).not.toContain('violence');
    expect(jsonData.preferences.contentToAvoid.length).toBe(basePreferences.contentToAvoid.length - 1);
    expect(response.status).toBe(200);
  });

  it('should not fail when removing non-existent content to avoid', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'REMOVE_CONTENT_TO_AVOID', content: 'nonexistent' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    // Should remain unchanged
    expect(jsonData.preferences.contentToAvoid).toEqual(basePreferences.contentToAvoid);
    expect(response.status).toBe(200);
  });

  it('should reset preferences to default state', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: { type: 'RESET' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    // Required fields should remain
    expect(jsonData.preferences.genrePreferences).toEqual(basePreferences.genrePreferences);
    expect(jsonData.preferences.constraints).toEqual(basePreferences.constraints);

    // Optional fields should be reset to defaults
    expect(jsonData.preferences.mood).toBeNull();
    expect(jsonData.preferences.themes).toEqual([]);
    expect(jsonData.preferences.pace).toBeNull();
    expect(jsonData.preferences.contentToAvoid).toEqual([]);
    expect(jsonData.preferences.desiredExperience).toBeNull();
    expect(jsonData.preferences.intensity).toBeNull();
    expect(response.status).toBe(200);
  });

  it('should return error for invalid preferences', async () => {
    const request = {
      json: async () => ({
        preferences: null,
        action: { type: 'SET_MOOD', mood: 'happy' }
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.error).toContain('Valid preferences object is required');
    expect(response.status).toBe(400);
  });

  it('should return error for invalid action', async () => {
    const request = {
      json: async () => ({
        preferences: basePreferences,
        action: null
      })
    };

    const response = await (await import('./route')).POST(request as Request);
    const jsonData = await response.json();

    expect(jsonData.error).toContain('Valid refinement action is required');
    expect(response.status).toBe(400);
  });
});