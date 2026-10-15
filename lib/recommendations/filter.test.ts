import { applyHardConstraints } from './filter';
import { TmdbMovie } from '../tmdb/normalize';

describe('Hard constraint filtering', () => {
  const mockMovies: TmdbMovie[] = [
    {
      id: 1,
      title: 'Adult Movie',
      overview: 'Test',
      genre_ids: [28],
      release_date: '2023-01-01',
      vote_average: 7.0,
      vote_count: 100,
      popularity: 50,
      runtime: 120,
      adult: true, // Should be filtered out
      poster_path: '/path1.jpg'
    },
    {
      id: 2,
      title: 'Family Movie',
      overview: 'Test',
      genre_ids: [35, 10751],
      release_date: '2023-06-01',
      vote_average: 8.0,
      vote_count: 200,
      popularity: 80,
      runtime: 90,
      adult: false,
      poster_path: '/path2.jpg'
    },
    {
      id: 3,
      title: 'Long Movie',
      overview: 'Test',
      genre_ids: [18],
      release_date: '2023-03-01',
      vote_average: 7.5,
      vote_count: 150,
      popularity: 60,
      runtime: 180, // 3 hours - should be filtered out if max is 120
      adult: false,
      poster_path: '/path3.jpg'
    },
    {
      id: 4,
      title: 'Old Movie',
      overview: 'Test',
      genre_ids: [36],
      release_date: '1990-05-01', // Should be filtered out if min year is 2000
      vote_average: 8.5,
      vote_count: 300,
      popularity: 90,
      runtime: 110,
      adult: false,
      poster_path: '/path4.jpg'
    },
    {
      id: 5,
      title: 'Perfect Movie',
      overview: 'Test',
      genre_ids: [28, 12],
      release_date: '2023-08-01',
      vote_average: 8.2,
      vote_count: 250,
      popularity: 75,
      runtime: 100,
      adult: false,
      poster_path: '/path5.jpg'
    }
  ];

  it('should filter out adult content when excludeAdultContent is true', () => {
    const constraints = { excludeAdultContent: true };
    const result = applyHardConstraints(mockMovies, constraints);

    expect(result.length).toBe(4);
    expect(result.some(m => m.adult)).toBe(false);
    expect(result.map(m => m.id)).toEqual([2, 3, 4, 5]);
  });

  it('should keep adult content when excludeAdultContent is false', () => {
    const constraints = { excludeAdultContent: false };
    const result = applyHardConstraints(mockMovies, constraints);

    expect(result.length).toBe(5);
    expect(result.map(m => m.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should filter by max runtime', () => {
    const constraints = { excludeAdultContent: false, maxRuntimeMinutes: 120 };
    const result = applyHardConstraints(mockMovies, constraints);

    expect(result.length).toBe(4);
    expect(result.some(m => m.runtime && m.runtime > 120)).toBe(false);
    expect(result.map(m => m.id)).toEqual([1, 2, 4, 5]);
  });

  it('should filter by release year range', () => {
    const constraints = {
      excludeAdultContent: false,
      releaseYearFrom: 2000,
      releaseYearTo: 2023
    };
    const result = applyHardConstraints(mockMovies, constraints);

    expect(result.length).toBe(4);
    expect(result.some(m => {
      const year = parseInt(m.release_date.substring(0, 4));
      return year < 2000 || year > 2023;
    })).toBe(false);
    expect(result.map(m => m.id)).toEqual([1, 2, 3, 5]);
  });

  it('should apply all constraints together', () => {
    const constraints = {
      excludeAdultContent: true,
      maxRuntimeMinutes: 120,
      releaseYearFrom: 2000,
      releaseYearTo: 2023
    };
    const result = applyHardConstraints(mockMovies, constraints);

    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([2, 5]);
  });
});