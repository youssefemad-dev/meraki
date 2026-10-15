import { scoreAndRankMovies } from './score';
import { TmdbMovie } from '../tmdb/normalize';
import { InterpretedPreferences } from '../schemas/preferences';

describe('Determinitive scoring algorithm', () => {
  const mockMovies: TmdbMovie[] = [
    {
      id: 1,
      title: 'Action Movie',
      overview: 'An exciting action-packed movie with great fight scenes',
      genre_ids: [28, 12], // Action, Adventure
      release_date: '2023-05-15',
      vote_average: 8.0,
      vote_count: 1000,
      popularity: 200,
      runtime: 120,
      adult: false,
      poster_path: '/path1.jpg'
    },
    {
      id: 2,
      title: 'Romantic Comedy',
      overview: 'A funny romantic story about finding love in unexpected places',
      genre_ids: [35, 10749], // Comedy, Romance
      release_date: '2022-08-20',
      vote_average: 7.5,
      vote_count: 500,
      popularity: 150,
      runtime: 105,
      adult: false,
      poster_path: '/path2.jpg'
    },
    {
      id: 3,
      title: 'Old Classic',
      overview: 'A black and white masterpiece from the golden age of cinema',
      genre_ids: [18, 36], // Drama, History
      release_date: '1950-01-01',
      vote_average: 8.5,
      vote_count: 2000,
      popularity: 50,
      runtime: 110,
      adult: false,
      poster_path: '/path3.jpg'
    }
  ];

  const preferences: InterpretedPreferences = {
    genrePreferences: ['Action', 'Adventure'],
    mood: 'energetic',
    themes: ['excitement', 'adventure'],
    pace: 'fast',
    contentToAvoid: ['slow-paced'],
    desiredExperience: 'excitement',
    intensity: 'high',
    constraints: {
      excludeAdultContent: true
    }
  };

  it('should score movies based on genre match', () => {
    const results = scoreAndRankMovies(mockMovies, preferences);

    // Action Movie should have highest genre match (2/2 genres = 1.0)
    // Romantic Comedy should have lower genre match (0/2 genres = 0.0)
    // Old Classic should have lowest genre match (0/2 genres = 0.0)

    expect(results[0].movie.id).toBe(1); // Action Movie should be ranked highest
    expect(results[0].breakdown.genreMatch).toBeCloseTo(1.0);
    expect(results[1].breakdown.genreMatch).toBeLessThan(0.5);
    expect(results[2].breakdown.genreMatch).toBeLessThan(0.5);
  });

  it('should boost score based on vote count (Bayesian average)', () => {
    // Create movies with same genre, theme, and recency factors but different vote counts/averages
    // to isolate the effect of Bayesian averaging on ratingBoost
    const moviesWithDifferentVotes: TmdbMovie[] = [
      {
        id: 1,
        title: 'High Votes, Lower Rating',
        overview: 'Test',
        genre_ids: [28, 12], // Action, Adventure
        release_date: '2023-01-01',
        vote_average: 6.0, // Lower actual average
        vote_count: 10000, // High vote count
        popularity: 100,
        runtime: 120,
        adult: false,
        poster_path: '/path1.jpg'
      },
      {
        id: 2,
        title: 'Low Votes, Higher Rating',
        overview: 'Test',
        genre_ids: [28, 12], // Action, Adventure
        release_date: '2023-01-01',
        vote_average: 8.5, // Higher actual average
        vote_count: 50, // Low vote count
        popularity: 50,
        runtime: 120,
        adult: false,
        poster_path: '/path2.jpg'
      }
    ];

    const results = scoreAndRankMovies(moviesWithDifferentVotes, preferences);

    // Due to Bayesian averaging:
    // Movie 1: Bayesian rating ≈ (10000/10100)*6.0 + (100/10100)*7.0 ≈ 6.01
    // Movie 2: Bayesian rating ≈ (50/150)*8.5 + (100/150)*7.0 ≈ 2.83 + 4.67 = 7.5
    // Movie 2 should have higher ratingBoost and thus higher overall score
    expect(results[0].movie.id).toBe(2); // Movie with low votes but higher rating should rank first
    expect(results[0].breakdown.ratingBoost).toBeGreaterThan(results[1].breakdown.ratingBoost);
  });

  it('should provide match reasons based on scoring breakdown', () => {
    const results = scoreAndRankMovies(mockMovies, preferences);

    // Each result should have matchReasons array with strings
    expect(Array.isArray(results[0].matchReasons)).toBe(true);
    expect(results[0].matchReasons.length).toBeGreaterThan(0);
    expect(typeof results[0].matchReasons[0]).toBe('string');

    // Match reasons should be grounded in actual movie data
    const actionMovieReasons = results[0].matchReasons;
    expect(actionMovieReasons.some(reason =>
      reason.toLowerCase().includes('action') ||
      reason.toLowerCase().includes('adventure')
    )).toBe(true);
  });
});