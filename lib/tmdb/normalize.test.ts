import { normalizeMovie } from './normalize';
import { TmdbMovie } from './normalize';

describe('TMDB normalization', () => {
  it('should normalize a complete movie object', () => {
    const rawMovie = {
      id: 123,
      title: 'Test Movie',
      overview: 'This is a test overview',
      genre_ids: [28, 12],
      release_date: '2023-05-15',
      vote_average: 7.5,
      vote_count: 1000,
      popularity: 250.5,
      runtime: 120,
      adult: false,
      poster_path: '/test poster path.jpg'
    };

    const result = normalizeMovie(rawMovie);

    const expected: TmdbMovie = {
      id: 123,
      title: 'Test Movie',
      overview: 'This is a test overview',
      genre_ids: [28, 12],
      release_date: '2023-05-15',
      vote_average: 7.5,
      vote_count: 1000,
      popularity: 250.5,
      runtime: 120,
      adult: false,
      poster_path: '/test poster path.jpg'
    };

    expect(result).toEqual(expected);
  });

  it('should handle missing optional fields', () => {
    const rawMovie = {
      id: 456,
      title: 'Movie with missing data',
      overview: 'Overview',
      genre_ids: [35],
      release_date: '2022-08-20',
      vote_average: 6.0,
      vote_count: 500
      // Missing popularity, runtime, adult, poster_path
    };

    const result = normalizeMovie(rawMovie);

    expect(result.id).toBe(456);
    expect(result.title).toBe('Movie with missing data');
    expect(result.overview).toBe('Overview');
    expect(result.genre_ids).toEqual([35]);
    expect(result.release_date).toBe('2022-08-20');
    expect(result.vote_average).toBe(6.0);
    expect(result.vote_count).toBe(500);
    expect(result.popularity).toBe(0); // Default value
    expect(result.runtime).toBeNull(); // Default value
    expect(result.adult).toBe(false); // Default value
    expect(result.poster_path).toBeNull(); // Default value
  });
});