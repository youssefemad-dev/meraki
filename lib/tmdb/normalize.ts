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

export function normalizeMovie(rawMovie: any): TmdbMovie {
  return {
    id: rawMovie.id,
    title: rawMovie.title,
    overview: rawMovie.overview || '',
    genre_ids: rawMovie.genre_ids || [],
    release_date: rawMovie.release_date || '',
    vote_average: rawMovie.vote_average || 0,
    vote_count: rawMovie.vote_count || 0,
    popularity: rawMovie.popularity || 0,
    runtime: rawMovie.runtime !== null && rawMovie.runtime !== undefined ? rawMovie.runtime : null,
    adult: rawMovie.adult || false,
    poster_path: rawMovie.poster_path || null
  };
}