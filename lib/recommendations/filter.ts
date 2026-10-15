import { InterpretedPreferences } from '../schemas/preferences';
import { TmdbMovie } from '../tmdb/normalize';

export function applyHardConstraints(
  movies: TmdbMovie[],
  constraints: InterpretedPreferences['constraints']
): TmdbMovie[] {
  return movies.filter(movie => {
    // Filter out adult content if requested
    if (constraints.excludeAdultContent && movie.adult) {
      return false;
    }

    // Filter by max runtime
    if (constraints.maxRuntimeMinutes !== undefined &&
        movie.runtime !== null &&
        movie.runtime > constraints.maxRuntimeMinutes) {
      return false;
    }

    // Filter by release year range
    if (constraints.releaseYearFrom !== undefined ||
        constraints.releaseYearTo !== undefined) {
      const releaseYear = parseInt(movie.release_date.substring(0, 4));

      if (constraints.releaseYearFrom !== undefined &&
          releaseYear < constraints.releaseYearFrom) {
        return false;
      }

      if (constraints.releaseYearTo !== undefined &&
          releaseYear > constraints.releaseYearTo) {
        return false;
      }
    }

    return true;
  });
}