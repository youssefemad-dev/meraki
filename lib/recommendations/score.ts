import { InterpretedPreferences } from '../schemas/preferences';
import { TmdbMovie } from '../tmdb/normalize';

export interface RecommendationScore {
  movie: TmdbMovie;
  score: number; // 0-100
  breakdown: {
    storyMatch?: number;      // 0-1
    genreMatch: number;      // 0-1
    themeMatch: number;      // 0-1
    ratingBoost: number;     // 0-1
    recencyBoost: number;    // 0-1
  };
  matchReasons: string[];
}

// Weights for the scoring algorithm (must sum to 1.0)
const STORY_CONCEPTS: Record<string, string[][]> = {
  'parent-child-ambivalence': [
    ['mother', 'mom', 'mum', 'father', 'dad', 'parent', 'daughter', 'son', 'child'],
    ['strained', 'complicated', 'difficult', 'conflict', 'clash', 'tension', 'resentment', 'distant', 'dislike', 'relationship']
  ],
  'parent-child-relationship': [
    ['mother', 'mom', 'mum', 'father', 'dad', 'parent', 'daughter', 'son', 'child'],
    ['relationship', 'bond', 'family', 'raising', 'growing up', 'reconcile']
  ],
  'loneliness-and-connection': [
    ['lonely', 'loneliness', 'alone', 'isolated', 'isolation', 'alienated', 'disconnected', 'disconnection'],
    ['connection', 'connect', 'bond', 'friendship', 'relationship', 'unlikely', 'companionship', 'understand', 'together']
  ],
  'post-graduation-transition': [
    ['graduation', 'graduate', 'graduated', 'college', 'university', 'campus'],
    ['adulthood', 'adult', 'twenties', 'after college', 'next chapter', 'career', 'future']
  ],
  'finding-direction': [
    ['lost', 'uncertain', 'confused', 'adrift', 'direction', 'purpose', 'meaning'],
    ['find direction', 'searching for', 'figure out', 'discover a path', 'find purpose']
  ],
  'uncertainty-and-direction': [
    ['overwhelmed', 'stressed', 'stuck', 'unsure', 'uncertain', 'adrift', 'lost'],
    ['what to do next', 'next step', 'finding direction', 'find purpose', 'where to start', 'path forward', 'find herself', 'find himself', 'find themselves', 'finds herself', 'finds himself', 'finds themselves']
  ],
  'family-conflict': [
    ['family', 'mother', 'mom', 'mum', 'father', 'dad', 'parent', 'daughter', 'son', 'sibling'],
    ['strained', 'complicated', 'difficult', 'conflict', 'clash', 'tension', 'resentment', 'distant', 'dispute']
  ]
};

export function scoreAndRankMovies(
  movies: TmdbMovie[],
  preferences: InterpretedPreferences
): RecommendationScore[] {
  return movies
    .map(movie => {
      // Calculate genreMatch: proportion of preferred genres present in movie
      const preferredGenresSet = new Set(
        preferences.genrePreferences.map(g => g.toLowerCase())
      );

      // For simplicity in MVP, we'll map a few common genre IDs to names
      // In a real app, you'd fetch the genre list from TMDB
      const genreIdToNameMap: Record<number, string> = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
      };

      const movieGenres = movie.genre_ids
        .map(id => genreIdToNameMap[id] || '')
        .filter(Boolean)
        .map(g => g.toLowerCase());

      const matchingGenres = movieGenres.filter(genre =>
        preferredGenresSet.has(genre)
      );

      const genreMatch = preferredGenresSet.size > 0
        ? matchingGenres.length / preferredGenresSet.size
        : 0;

      // Calculate themeMatch: simple keyword matching in overview
      const themeKeywords = preferences.themes
        .map(t => t.toLowerCase())
        .filter(Boolean);

      const themeMatch = themeKeywords.length > 0
        ? (themeKeywords.filter(keyword =>
            movie.overview.toLowerCase().includes(keyword)
          ).length / themeKeywords.length)
        : 0.5; // Neutral if no themes specified

      // Match the situation's relationship/story concepts against plot summaries.
      const overview = movie.overview.toLowerCase();
      const includesTerm = (text: string, term: string) => {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escapedTerm}\\b`).test(text);
      };
      const storySignals = preferences.storySignals ?? [];
      const storyBuckets = storySignals.flatMap(signal => STORY_CONCEPTS[signal] ?? []);
      const signalMatch = storySignals.some(signal => {
        const buckets = STORY_CONCEPTS[signal] ?? [];
        return buckets.length > 0 && buckets.every(bucket =>
          bucket.some(term => includesTerm(overview, term))
        );
      }) ? 1 : 0;
      const aliases: Record<string, string[]> = {
        mother: ['mother', 'mom', 'mum'], mom: ['mother', 'mom', 'mum'],
        daughter: ['daughter', 'girl', 'teenage', 'teen'],
        teenage: ['teenage', 'teen', 'high school'],
        'coming of age': ['coming of age', 'teenage', 'high school', 'growing up'],
        strained: ['strained', 'complicated', 'difficult', 'conflict', 'tension'],
        complicated: ['complicated', 'strained', 'difficult', 'conflict', 'tension'],
        loneliness: ['loneliness', 'lonely', 'alone', 'isolated', 'isolation', 'alienated'],
        isolation: ['isolation', 'isolated', 'lonely', 'alone', 'disconnected'],
        connection: ['connection', 'connect', 'bond', 'relationship', 'friendship', 'companionship'],
        unexpected: ['unexpected', 'unlikely', 'unusual'],
        graduation: ['graduation', 'graduate', 'graduated', 'college', 'university'],
        'post-graduation': ['graduation', 'graduate', 'college', 'university', 'after school'],
        college: ['college', 'university', 'campus', 'graduate', 'graduation'],
        adulthood: ['adulthood', 'adult', 'grown up', 'twenties'],
        uncertainty: ['uncertain', 'uncertainty', 'unsure', 'confused', 'lost', 'stuck'],
        future: ['uncertain future', 'future plans', 'future direction'],
        'next step': ['next step', 'what to do next', 'where to start'],
        direction: ['finding direction', 'find direction', 'direction in life'],
        purpose: ['purpose', 'meaning', 'calling'],
        overwhelmed: ['overwhelmed', 'stressed', 'burdened', 'overloaded'],
        finding: ['finding', 'find', 'finds', 'searching', 'discovering', 'figure out'],
        yourself: ['yourself', 'herself', 'himself', 'themselves'],
        self: ['yourself', 'herself', 'himself', 'themselves'],
        discovery: ['discovery', 'discover', 'discovering', 'finding']
      };
      const storyKeywords = preferences.storyKeywords ?? [];
      const keywordScores = storyKeywords.map(keyword => {
        const terms = keyword.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 3 && !['relationship', 'between', 'about'].includes(term));
        if (terms.length === 0) return 0;
        const matchedTerms = terms.filter(term => (aliases[term] ?? [term]).some(alias => includesTerm(overview, alias)));
        return terms.length > 1 && matchedTerms.length < 2
          ? 0
          : matchedTerms.length / terms.length;
      });
      const keywordMatch = keywordScores.length ? Math.max(...keywordScores) : 0;
      const storyMatch = storyBuckets.length ? signalMatch : keywordMatch;
      const hasStoryIntent = storySignals.length > 0 || storyKeywords.length > 0;

      // Calculate ratingBoost: normalized vote average, weighted by vote_count (Bayesian)
      // Using a simplified Bayesian average: (v/(v+m))*R + (m/(v+m))*C
      // where v = vote_count, m = minimum votes (say 100), R = movie rating, C = average vote (say 7.0)
      const minVotes = 100;
      const averageVote = 7.0;
      const bayesianRating =
        (movie.vote_count / (movie.vote_count + minVotes)) * movie.vote_average +
        (minVotes / (movie.vote_count + minVotes)) * averageVote;

      // Normalize to 0-1 (assuming vote range 0-10)
      const ratingBoost = bayesianRating / 10;

      // Calculate recencyBoost: newer films get slight boost
      const releaseYear = parseInt(movie.release_date.substring(0, 4));
      const currentYear = new Date().getFullYear();
      const yearsOld = currentYear - releaseYear;

      // Normalize so that movies from this year get 1.0, movies 50+ years old get 0.0
      const recencyBoost = Math.max(0, Math.min(1, 1 - (yearsOld / 50)));

      // Calculate final score (0-100)
      const weights = hasStoryIntent
        ? { storyMatch: 0.7, genreMatch: 0.1, themeMatch: 0.1, ratingBoost: 0.08, recencyBoost: 0.02 }
        : { storyMatch: 0, genreMatch: 0.4, themeMatch: 0.3, ratingBoost: 0.2, recencyBoost: 0.1 };
      const score = (
        weights.storyMatch * storyMatch +
        weights.genreMatch * genreMatch +
        weights.themeMatch * themeMatch +
        weights.ratingBoost * ratingBoost +
        weights.recencyBoost * recencyBoost
      ) * 100;

      // Generate match reasons based on actual data
      const matchReasons: string[] = [];

      if (storyMatch >= 0.4) {
        const storyDescriptions: Record<string, string> = {
          'parent-child-ambivalence': 'a complicated parent-child relationship',
          'parent-child-relationship': 'a parent-child relationship',
          'loneliness-and-connection': 'loneliness and human connection',
          'post-graduation-transition': 'the transition after graduation',
          'finding-direction': 'finding direction and purpose',
          'uncertainty-and-direction': 'uncertainty about what comes next',
          'family-conflict': 'family conflict'
        };
        const matchedStory = storySignals
          .filter(signal => {
            const buckets = STORY_CONCEPTS[signal] ?? [];
            return buckets.length > 0 && buckets.every(bucket =>
              bucket.some(term => includesTerm(overview, term))
            );
          })
          .map(signal => storyDescriptions[signal])
          .filter((description): description is string => Boolean(description));
        if (matchedStory.length) {
          matchReasons.push(`The plot connects with ${matchedStory.join(' and ')}`);
        } else if (preferences.situationSummary) {
          matchReasons.push(`The plot relates to your situation: "${preferences.situationSummary}"`);
        } else {
          matchReasons.push('The plot connects with the situation you described');
        }
      }

      if (genreMatch > 0.7 && (!hasStoryIntent || storyMatch >= 0.75)) {
        matchReasons.push(`Strong genre match with ${matchingGenres.join(', ')}`);
      } else if (genreMatch > 0.3 && (!hasStoryIntent || storyMatch >= 0.75)) {
        matchReasons.push(`Good genre match with ${matchingGenres.join(', ')}`);
      }

      if (themeMatch > 0.6) {
        matchReasons.push(`Themes of ${themeKeywords.slice(0, 2).join(', ')} align with your preferences`);
      }

      if (ratingBoost > 0.7 && (!hasStoryIntent || storyMatch >= 0.75)) {
        matchReasons.push(`Highly rated by audiences (${movie.vote_average}/10 from ${movie.vote_count} votes)`);
      }

      if (!hasStoryIntent && recencyBoost > 0.8) {
        matchReasons.push(`Recent release (${releaseYear}) that fits your taste for contemporary films`);
      } else if (!hasStoryIntent && recencyBoost > 0.5) {
        matchReasons.push(`Well-regarded film from ${releaseYear} with lasting appeal`);
      }

      // If we don't have strong matches, provide a generic reason
      if (matchReasons.length === 0) {
        matchReasons.push(`Selected for its overall appeal and availability`);
      }

      return {
        movie,
        score: Math.round(score * 10) / 10, // Keep one decimal place
        breakdown: {
          storyMatch: Number(storyMatch.toFixed(3)),
          genreMatch: Number(genreMatch.toFixed(3)),
          themeMatch: Number(themeMatch.toFixed(3)),
          ratingBoost: Number(ratingBoost.toFixed(3)),
          recencyBoost: Number(recencyBoost.toFixed(3))
        },
        matchReasons
      };
    })
    .sort((a, b) => b.score - a.score); // Descending order by score
}
