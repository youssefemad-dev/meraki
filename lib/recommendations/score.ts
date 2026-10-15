import { InterpretedPreferences } from '../schemas/preferences';
import { TmdbMovie } from '../tmdb/normalize';

export interface RecommendationScore {
  movie: TmdbMovie;
  score: number; // 0-100
  breakdown: {
    genreMatch: number;      // 0-1
    themeMatch: number;      // 0-1
    ratingBoost: number;     // 0-1
    recencyBoost: number;    // 0-1
  };
  matchReasons: string[];
}

// Weights for the scoring algorithm (must sum to 1.0)
const WEIGHTS = {
  genreMatch: 0.4,
  themeMatch: 0.3,
  ratingBoost: 0.2,
  recencyBoost: 0.1
};

// Helper function to normalize a value to 0-1 range
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

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
      const score = (
        WEIGHTS.genreMatch * genreMatch +
        WEIGHTS.themeMatch * themeMatch +
        WEIGHTS.ratingBoost * ratingBoost +
        WEIGHTS.recencyBoost * recencyBoost
      ) * 100;

      // Generate match reasons based on actual data
      const matchReasons: string[] = [];

      if (genreMatch > 0.7) {
        matchReasons.push(`Strong genre match with ${matchingGenres.join(', ')}`);
      } else if (genreMatch > 0.3) {
        matchReasons.push(`Good genre match with ${matchingGenres.join(', ')}`);
      }

      if (themeMatch > 0.6) {
        matchReasons.push(`Themes of ${themeKeywords.slice(0, 2).join(', ')} align with your preferences`);
      }

      if (ratingBoost > 0.7) {
        matchReasons.push(`Highly rated by audiences (${movie.vote_average}/10 from ${movie.vote_count} votes)`);
      }

      if (recencyBoost > 0.8) {
        matchReasons.push(`Recent release (${releaseYear}) that fits your taste for contemporary films`);
      } else if (recencyBoost > 0.5) {
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