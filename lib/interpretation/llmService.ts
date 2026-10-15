import { InterpretedPreferences } from '../schemas/preferences';

/**
 * Interpret user situation description into structured preferences
 * In a production implementation, this would call an actual LLM API
 * For MVP, we use rule-based logic as a placeholder
 */
export async function interpretSituation(situation: string): Promise<InterpretedPreferences> {
  // Normalize input for easier matching
  const normalized = situation.toLowerCase();

  // Initialize preferences with default values
  const preferences: InterpretedPreferences = {
    genrePreferences: [],
    mood: null,
    themes: [],
    pace: null,
    contentToAvoid: [],
    desiredExperience: null,
    intensity: null,
    constraints: {
      excludeAdultContent: true
    }
  };

  // Genre detection
  const genreMap: Record<string, string[]> = {
    action: ['Action', 'Adventure'],
    comedy: ['Comedy'],
    drama: ['Drama'],
    horror: ['Horror'],
    romance: ['Romance'],
    scifi: ['Science Fiction'],
    'sci-fi': ['Science Fiction'],
    thriller: ['Thriller'],
    documentary: ['Documentary'],
    animation: ['Animation'],
    family: ['Family']
  };

  // Additional genre keywords that map to existing genres
  const genreKeywordMap: Record<string, string[]> = {
    funny: ['Comedy'],
    action: ['Action', 'Adventure'], // redundant but explicit
    adventurous: ['Action', 'Adventure'],
    horrific: ['Horror'],
    romantic: ['Romance'],
    scifi: ['Science Fiction'],
    scientific: ['Science Fiction'],
    thrilling: ['Thriller'],
    documentary: ['Documentary'],
    animated: ['Animation'],
    familial: ['Family']
  };

  // Check genre map
  for (const [keyword, genres] of Object.entries(genreMap)) {
    if (normalized.includes(keyword)) {
      preferences.genrePreferences.push(...genres);
    }
  }

  // Check additional genre keywords
  for (const [keyword, genres] of Object.entries(genreKeywordMap)) {
    if (normalized.includes(keyword)) {
      preferences.genrePreferences.push(...genres);
    }
  }

  // Ensure we have at least one genre preference
  if (preferences.genrePreferences.length === 0) {
    preferences.genrePreferences = ['Drama']; // Default fallback
  }

  // Remove duplicates
  preferences.genrePreferences = [...new Set(preferences.genrePreferences)];

  // Mood detection
  const moodMap: Record<string, NonNullable<InterpretedPreferences['mood']>[]> = {
    happy: ['happy', 'joyful', 'cheerful', 'content', 'satisfied'],
    sad: ['sad', 'melancholic', 'somber', 'depressed', 'unhappy'],
    energetic: ['energetic', 'excited', 'pumped', 'exciting', 'lively'],
    relaxed: ['relaxed', 'calm', 'peaceful', 'laid back', 'easygoing'],
    thoughtful: ['thoughtful', 'contemplative', 'reflective', 'serious', 'deep'],
    romantic: ['romantic', 'loving', 'affectionate', 'passionate', 'intimate'],
    scary: ['scary', 'frightened', 'fearful', 'frightening', 'terrifying'],
    nostalgic: ['nostalgic', 'sentimental', 'wistful', 'melancholic', 'bittersweet']
  };

  // Check for mood keywords in the situation
  for (const [mood, keywords] of Object.entries(moodMap)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      preferences.mood = mood as NonNullable<InterpretedPreferences['mood']>;
      break;
    }
  }

  // Theme detection
  const themeKeywords = ['love', 'war', 'betrayal', 'redemption', 'journey',
                        'survival', 'hope', 'loss', 'family', 'friendship', 'exciting'];
  preferences.themes = themeKeywords.filter(theme =>
    normalized.includes(theme)
  );

  // Pace detection
  const paceMap: Record<string, NonNullable<InterpretedPreferences['pace']>[]> = {
    fast: ['fast', 'quick', 'rapid', 'action-packed', 'high-energy', 'adrenaline-pumping', 'action'],
    slow: ['slow', 'leisurely', 'deliberate'],
    moderate: ['moderate', 'medium', 'steady']
  };

  // Check for pace keywords in the situation
  for (const [pace, keywords] of Object.entries(paceMap)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      preferences.pace = pace as NonNullable<InterpretedPreferences['pace']>;
      break;
    }
  }

  // Content to avoid detection
  const avoidKeywords = ['violence', 'gore', 'horror', 'scary'];
  preferences.contentToAvoid = avoidKeywords.filter(keyword =>
    normalized.includes(keyword)
  );

  // Also check for common variations
  if (normalized.includes('violent')) {
    preferences.contentToAvoid.push('violence');
  }
  if (normalized.includes('horrific') || normalized.includes('horrors')) {
    preferences.contentToAvoid.push('horror');
  }

  // Desired experience detection
  const experienceMap: Record<string, NonNullable<InterpretedPreferences['desiredExperience']>[]> = {
    inspiration: ['inspiration', 'inspiring', 'motivating'],
    escapism: ['escapism', 'escape', 'distraction'],
    education: ['education', 'learning', 'informative'],
    comfort: ['comfort', 'comforting', 'cozy'],
    excitement: ['excitement', 'exciting', 'thrilling'],
    relaxation: ['relaxation', 'relaxing', 'unwinding'],
    romance: ['romance', 'romantic', 'love']
  };

  // Check for experience keywords in the situation
  for (const [experience, keywords] of Object.entries(experienceMap)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      preferences.desiredExperience = experience as NonNullable<InterpretedPreferences['desiredExperience']>;
      break;
    }
  }

  // Intensity detection
  const intensityMap: Record<string, NonNullable<InterpretedPreferences['intensity']>[]> = {
    low: ['low', 'mild', 'gentle'],
    medium: ['medium', 'moderate', 'balanced'],
    high: ['high', 'intense', 'extreme']
  };

  // Check for intensity keywords in the situation
  for (const [intensity, keywords] of Object.entries(intensityMap)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      preferences.intensity = intensity as NonNullable<InterpretedPreferences['intensity']>;
      break;
    }
  }

  // Runtime constraints
  if (normalized.includes('short') || normalized.includes('under 90 minutes')) {
    preferences.constraints.maxRuntimeMinutes = 90;
  } else if (normalized.includes('long') || normalized.includes('epic')) {
    preferences.constraints.maxRuntimeMinutes = 180;
  }

  // Year constraints
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 10) {
      // If they mention an older year, set it as a minimum
      preferences.constraints.releaseYearFrom = year;
    } else if (year > currentYear - 2) {
      // If they mention a very recent year, set it as both min and max
      preferences.constraints.releaseYearFrom = year;
      preferences.constraints.releaseYearTo = year;
    }
  }

  return preferences;
}