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

  it('ranks stories about strained mother-daughter relationships for that situation', () => {
    const storyPreferences: InterpretedPreferences = {
      ...preferences,
      genrePreferences: ['Drama', 'Family'],
      storySignals: ['parent-child-ambivalence', 'family-conflict'],
      storyKeywords: ['mother daughter relationship', 'coming of age', 'family conflict'],
      themes: ['family', 'conflicted affection']
    };
    const movies = [
      {
        ...mockMovies[0],
        id: 10,
        title: 'Lady Bird',
        overview: 'A teenager navigates a strained relationship with her mother.',
        genre_ids: [18, 35]
      },
      {
        ...mockMovies[0],
        id: 11,
        title: 'Popular Action Movie',
        overview: 'An agent races to stop a global threat.',
        genre_ids: [28, 12]
      }
    ];

    const results = scoreAndRankMovies(movies, storyPreferences);

    expect(results[0].movie.title).toBe('Lady Bird');
    expect(results[0].breakdown.storyMatch).toBeGreaterThan(results[1].breakdown.storyMatch ?? 0);
  });

  it('ranks stories about loneliness and connection for a lonely viewer', () => {
    const storyPreferences: InterpretedPreferences = {
      ...preferences,
      genrePreferences: ['Drama', 'Romance'],
      storySignals: ['loneliness-and-connection'],
      storyKeywords: ['loneliness', 'social isolation', 'unexpected connection'],
      themes: ['loneliness', 'connection']
    };
    const movies = [
      {
        ...mockMovies[0],
        id: 12,
        title: 'Lost in Translation',
        overview: 'A lonely movie star and a neglected young woman form an unlikely bond in Tokyo.',
        genre_ids: [18, 10749]
      },
      {
        ...mockMovies[0],
        id: 13,
        title: 'Popular Action Movie',
        overview: 'An agent races to stop a global threat.',
        genre_ids: [28, 12]
      }
    ];

    const results = scoreAndRankMovies(movies, storyPreferences);

    expect(results[0].movie.title).toBe('Lost in Translation');
    expect(results[0].breakdown.storyMatch).toBeGreaterThan(results[1].breakdown.storyMatch ?? 0);
  });

  it('weights story keywords even when the interpreter returns no story signal', () => {
    const storyPreferences: InterpretedPreferences = {
      ...preferences,
      storySignals: [],
      storyKeywords: ['loneliness', 'unexpected connection'],
      genrePreferences: ['Drama']
    };
    const movies = [
      {
        ...mockMovies[0],
        id: 14,
        title: 'A Quiet Connection',
        overview: 'A lonely traveler forms an unexpected connection.',
        genre_ids: [18]
      },
      {
        ...mockMovies[0],
        id: 15,
        title: 'Popular Action Movie',
        overview: 'An agent races to stop a global threat.',
        genre_ids: [28, 12]
      }
    ];

    const results = scoreAndRankMovies(movies, storyPreferences);

    expect(results[0].movie.title).toBe('A Quiet Connection');
    expect(results[0].breakdown.storyMatch).toBeGreaterThan(0);
  });

  it('ranks a relevant graduation story over a popular recent movie', () => {
    const storyPreferences: InterpretedPreferences = {
      ...preferences,
      storySignals: ['post-graduation-transition', 'finding-direction'],
      storyKeywords: [
        'post-graduation uncertainty',
        'life after college',
        'finding direction and purpose',
        'entering adulthood'
      ],
      genrePreferences: ['Drama', 'Comedy'],
      themes: ['transition', 'finding purpose', 'coming of age']
    };
    const movies = [
      {
        ...mockMovies[0],
        id: 16,
        title: 'The Graduate',
        overview: 'A young man, recently graduated from college, feels uncertain about his future and direction in life. He struggles to figure out what he wants.',
        genre_ids: [18, 35],
        release_date: '1967-12-21',
        popularity: 10
      },
      {
        ...mockMovies[0],
        id: 17,
        title: 'Popular 2026 Action Movie',
        overview: 'An agent fights a dangerous criminal organization.',
        genre_ids: [28, 12],
        release_date: '2026-01-01',
        popularity: 10000
      }
    ];

    const results = scoreAndRankMovies(movies, storyPreferences);

    expect(results[0].movie.title).toBe('The Graduate');
    expect(results[0].matchReasons[0]).toContain('finding direction');
    expect(results[0].breakdown.storyMatch).toBeGreaterThanOrEqual(0.4);
    expect(results[1].breakdown.storyMatch).toBeLessThan(0.4);
  });

  it('matches feeling lost with a plot about losing direction and finding oneself', () => {
    const storyPreferences: InterpretedPreferences = {
      ...preferences,
      storySignals: ['uncertainty-and-direction'],
      storyKeywords: ['feeling overwhelmed by life', 'finding yourself'],
      genrePreferences: ['Drama', 'Comedy'],
      themes: ['self-discovery', 'resilience', 'finding purpose']
    };
    const movie = {
      ...mockMovies[0],
      id: 18,
      title: 'A New Direction',
      overview: 'She has lost her spark and is sent away to find herself and rediscover her passion.',
      genre_ids: [18, 35]
    };

    const [result] = scoreAndRankMovies([movie], storyPreferences);

    expect(result.breakdown.storyMatch).toBe(1);
    expect(result.matchReasons[0]).toContain('uncertainty about what comes next');
  });
});