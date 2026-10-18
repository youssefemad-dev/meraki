import { POST } from './route';
import { TMDBClient } from '@/lib/tmdb/client';
import { interpretSituation, selectMovieRecommendations, AiServiceError } from '@/lib/interpretation/llmService';
import type { InterpretedPreferences } from '@/lib/schemas/preferences';
import type { RecommendationScore } from '@/lib/recommendations/score';
import type { TmdbMovie } from '@/lib/tmdb/normalize';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options: { status?: number } = {}) => ({
      json: async () => data,
      status: options.status ?? 200
    })
  }
}));

jest.mock('@/lib/interpretation/llmService', () => ({
  AiServiceError: class AiServiceError extends Error {},
  interpretSituation: jest.fn(),
  selectMovieRecommendations: jest.fn()
}));

describe('Discovery API route', () => {
  const preferences: InterpretedPreferences = {
    situationSummary: 'You feel lonely and want a story about an unexpected connection.',
    genrePreferences: ['Romance'],
    storySignals: ['loneliness-and-connection'],
    storyKeywords: ['loneliness', 'unexpected connection', 'unlikely friendship'],
    mood: 'peaceful',
    themes: ['connection'],
    pace: null,
    contentToAvoid: [],
    desiredExperience: 'comfort',
    intensity: 'low',
    constraints: { excludeAdultContent: true, maxRuntimeMinutes: 100 }
  };

  const previousApiKey = process.env.TMDB_API_KEY;
  const previousNvidiaKey = process.env.NVIDIA_API_KEY;
  let discoverMoviesMock: jest.SpyInstance;
  let searchKeywordMock: jest.SpyInstance;
  let searchMoviesMock: jest.SpyInstance;
  let fetchMoviesByKeywordsMock: jest.SpyInstance;
  const interpretMock = jest.mocked(interpretSituation);
  const selectMock = jest.mocked(selectMovieRecommendations);
  const makeRequest = (body: unknown) => ({ json: async () => body }) as Request;
  const makeRecommendation = (movie: TmdbMovie): RecommendationScore => ({
    movie,
    score: 90,
    breakdown: { storyMatch: 0.9, genreMatch: 0, themeMatch: 0, ratingBoost: 0, recencyBoost: 0 },
    matchReasons: ['The plot matches the situation.']
  });

  beforeEach(() => {
    process.env.TMDB_API_KEY = 'test-api-key';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    discoverMoviesMock = jest.spyOn(TMDBClient.prototype, 'fetchDiscoverMovies').mockResolvedValue(
      [1, 2, 3, 4].map(id => ({
        id,
        title: `TMDB movie ${id}`,
        overview: 'A quiet story about a lonely person finding an unexpected connection.',
        genre_ids: [10749],
        release_date: '2024-01-01',
        vote_average: 8,
        vote_count: 200,
        popularity: 100,
        runtime: 95,
        adult: false,
        poster_path: null
      }))
    );
    searchKeywordMock = jest.spyOn(TMDBClient.prototype, 'searchKeyword').mockResolvedValue([]);
    searchMoviesMock = jest.spyOn(TMDBClient.prototype, 'searchMovies').mockResolvedValue([]);
    fetchMoviesByKeywordsMock = jest.spyOn(TMDBClient.prototype, 'fetchMoviesByKeywords').mockResolvedValue([]);
    interpretMock.mockResolvedValue(preferences);
    selectMock.mockImplementation(async (_situation, _preferences, candidates) =>
      candidates.slice(0, 3).map(makeRecommendation)
    );
  });

  afterEach(() => {
    discoverMoviesMock.mockRestore();
    searchKeywordMock.mockRestore();
    searchMoviesMock.mockRestore();
    fetchMoviesByKeywordsMock.mockRestore();
    jest.clearAllMocks();
    if (previousApiKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = previousApiKey;
    if (previousNvidiaKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = previousNvidiaKey;
  });

  it('has the LLM select multiple movies from TMDB candidates', async () => {
    const response = await POST(makeRequest({ preferences }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.preferences).toEqual(preferences);
    expect(data.recommendations).toHaveLength(3);
    expect(selectMock).toHaveBeenCalledWith(expect.any(String), preferences, expect.any(Array));
    expect(discoverMoviesMock).toHaveBeenCalledTimes(3);
  });

  it('uses LLM-generated story searches ahead of genre candidates', async () => {
    const searchCandidates = [21, 22, 23].map(id => ({
      id,
      title: `Story search ${id}`,
      overview: 'A plot about loneliness and unexpected connection.',
      genre_ids: [18],
      release_date: '2020-01-01',
      vote_average: 7,
      vote_count: 100,
      popularity: 20,
      runtime: 100,
      adult: false,
      poster_path: null
    }));
    searchMoviesMock.mockResolvedValue(searchCandidates);
    searchKeywordMock.mockResolvedValue([{ id: 101, name: 'loneliness' }]);

    const response = await POST(makeRequest({ preferences }));

    expect(response.status).toBe(200);
    expect(searchMoviesMock).toHaveBeenCalledWith('loneliness');
    expect(searchMoviesMock).toHaveBeenCalledWith('unexpected connection');
    expect(searchMoviesMock).toHaveBeenCalledWith('unlikely friendship');
    expect(fetchMoviesByKeywordsMock).toHaveBeenCalledWith([101]);
    const passedCandidates = selectMock.mock.calls[0][2];
    expect(passedCandidates.slice(0, 3).map(movie => movie.title)).toEqual([
      'Story search 21', 'Story search 22', 'Story search 23'
    ]);
  });

  it('interprets free-form user input with the LLM before searching TMDB', async () => {
    const situation = 'i feel lonley after gradution and dont no wat comes next';

    const response = await POST(makeRequest({ situation }));

    expect(response.status).toBe(200);
    expect(interpretMock).toHaveBeenCalledWith(situation);
    expect(selectMock).toHaveBeenCalledWith(situation, preferences, expect.any(Array));
  });

  it('returns explicit LLM errors without fallback recommendations', async () => {
    selectMock.mockRejectedValue(new AiServiceError('AI could not select relevant movies.'));

    const response = await POST(makeRequest({ preferences }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'AI could not select relevant movies.' });
  });

  it('returns interpretation failures without searching or recommending defaults', async () => {
    interpretMock.mockRejectedValue(new AiServiceError('AI interpretation failed.'));

    const response = await POST(makeRequest({ situation: 'I need a movie about my life' }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'AI interpretation failed.' });
    expect(discoverMoviesMock).not.toHaveBeenCalled();
    expect(selectMock).not.toHaveBeenCalled();
  });

  it('rejects malformed supplied preferences', async () => {
    const response = await POST(makeRequest({ preferences: { genrePreferences: [] } }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Valid preferences are required' });
    expect(discoverMoviesMock).not.toHaveBeenCalled();
  });
});
