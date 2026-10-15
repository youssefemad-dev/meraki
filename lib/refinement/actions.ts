import { InterpretedPreferences } from '../schemas/preferences';

// Refinement actions that can be applied to adjust preferences
export type RefinementAction =
  | { type: 'SET_DESIRED_EXPERIENCE'; experience: InterpretedPreferences['desiredExperience'] }
  | { type: 'SET_MOOD'; mood: InterpretedPreferences['mood'] }
  | { type: 'SET_INTENSITY'; intensity: InterpretedPreferences['intensity'] }
  | { type: 'ADD_THEME'; theme: string }
  | { type: 'ADD_CONTENT_TO_AVOID'; content: string }
  | { type: 'REMOVE_CONTENT_TO_AVOID'; content: string }
  | { type: 'RESET' };

/**
 * Apply a refinement action to the current preferences, returning a new preferences object
 * @param currentPreferences The current interpreted preferences
 * @param action The refinement action to apply
 * @returns New preferences object with the action applied
 */
export function applyRefinementAction(
  currentPreferences: InterpretedPreferences,
  action: RefinementAction
): InterpretedPreferences {
  switch (action.type) {
    case 'SET_DESIRED_EXPERIENCE':
      return {
        ...currentPreferences,
        desiredExperience: action.experience
      };

    case 'SET_MOOD':
      return {
        ...currentPreferences,
        mood: action.mood
      };

    case 'SET_INTENSITY':
      return {
        ...currentPreferences,
        intensity: action.intensity
      };

    case 'ADD_THEME':
      // Avoid duplicates
      const hasTheme = currentPreferences.themes.some(t => t.toLowerCase() === action.theme.toLowerCase());
      return {
        ...currentPreferences,
        themes: hasTheme
          ? currentPreferences.themes
          : [...currentPreferences.themes, action.theme]
      };

    case 'ADD_CONTENT_TO_AVOID':
      // Avoid duplicates
      const hasContentToAvoid = currentPreferences.contentToAvoid.some(c => c.toLowerCase() === action.content.toLowerCase());
      return {
        ...currentPreferences,
        contentToAvoid: hasContentToAvoid
          ? currentPreferences.contentToAvoid
          : [...currentPreferences.contentToAvoid, action.content]
      };

    case 'REMOVE_CONTENT_TO_AVOID':
      return {
        ...currentPreferences,
        contentToAvoid: currentPreferences.contentToAvoid.filter(
          c => c.toLowerCase() !== action.content.toLowerCase()
        )
      };

    case 'RESET':
      // Return preferences with only the required fields, resetting everything else to defaults
      return {
        ...currentPreferences,
        mood: null,
        themes: [],
        pace: null,
        contentToAvoid: [],
        desiredExperience: null,
        intensity: null
      };
  }
}