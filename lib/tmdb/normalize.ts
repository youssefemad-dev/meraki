export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  genre_ids: number[];
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime: number | null; // in minutes, null if not available
  adult: boolean;
  poster_path: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeMovie(rawMovie: unknown): TmdbMovie {
  const movie = asRecord(rawMovie);

  return {
    id: finiteNumber(movie.id),
    title: typeof movie.title === 'string' ? movie.title : '',
    overview: typeof movie.overview === 'string' ? movie.overview : '',
    genre_ids: Array.isArray(movie.genre_ids)
      ? movie.genre_ids.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
      : [],
    release_date: typeof movie.release_date === 'string' ? movie.release_date : '',
    vote_average: finiteNumber(movie.vote_average),
    vote_count: finiteNumber(movie.vote_count),
    popularity: finiteNumber(movie.popularity),
    runtime: movie.runtime === null || movie.runtime === undefined
      ? null
      : finiteNumber(movie.runtime, 0),
    adult: typeof movie.adult === 'boolean' ? movie.adult : false,
    poster_path: typeof movie.poster_path === 'string' ? movie.poster_path : null
  };
}
