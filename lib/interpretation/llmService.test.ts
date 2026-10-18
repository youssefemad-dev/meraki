import { interpretSituation, selectMovieRecommendations, AiServiceError } from './llmService';
import type { InterpretedPreferences } from '../schemas/preferences';
import type { TmdbMovie } from '../tmdb/normalize';

describe('LLM movie interpretation and selection', () => {
  const previousNvidiaKey = process.env.NVIDIA_API_KEY;
  const previousFetch = global.fetch;
  const preferences: InterpretedPreferences = {
    situationSummary: 'You feel isolated and want an unexpected human connection.',
    genrePreferences: ['Drama', 'Romance'],
    storySignals: ['loneliness-and-connection'],
    storyKeywords: ['quiet loneliness', 'unexpected friendship', 'unlikely connection'],
    mood: 'melancholic',
    themes: ['connection', 'isolation'],
    pace: null,
    contentToAvoid: [],
    desiredExperience: 'comfort',
    intensity: null,
    constraints: { excludeAdultContent: true }
  };
  const candidates: TmdbMovie[] = [1, 2, 3, 4].map(id => ({
    id,
    title: `Candidate ${id}`,
    overview: `A thoughtful story about loneliness and an unexpected connection, number ${id}.`,
    genre_ids: [18, 10749],
    release_date: '2020-01-01',
    vote_average: 7.5,
    vote_count: 500,
    popularity: 30,
    runtime: 110,
    adult: false,
    poster_path: null
  }));

  afterEach(() => {
    global.fetch = previousFetch;
    if (previousNvidiaKey === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = previousNvidiaKey;
    }
    jest.restoreAllMocks();
  });

  function mockNvidiaResponse(content: unknown, ok = true, status = 200) {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      status,
      json: async () => ({ choices: [{ message: { content } }] })
    }) as unknown as typeof fetch;
  }

  it('interprets typo-filled natural language using the LLM without local-rule fallback', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    const timeoutMock = jest.spyOn(AbortSignal, 'timeout');
    const rawInput = 'i feel lonley after gradution and dont no wat comes next';
    const modelResult = {
      situationSummary: 'You feel lonely and uncertain about life after graduation.',
      genrePreferences: ['Drama', 'Comedy'],
      storySignals: ['post-graduation-transition', 'loneliness-and-connection'],
      storyKeywords: ['loneliness after college', 'uncertain graduates', 'finding direction after graduation'],
      storyReferences: ['The Graduate'],
      themes: ['transition', 'connection'],
      mood: 'melancholic',
      pace: null,
      intensity: null,
      desiredExperience: 'comfort',
      contentToAvoid: [],
      constraints: { excludeAdultContent: true }
    };
    mockNvidiaResponse(`\`\`\`json\n${JSON.stringify(modelResult)}\n\`\`\``);

    const interpreted = await interpretSituation(rawInput);

    expect(interpreted.situationSummary).toBe(modelResult.situationSummary);
    expect(interpreted.storySignals).toEqual(modelResult.storySignals);
    expect(interpreted.storyReferences).toEqual(modelResult.storyReferences);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(rawInput)
      })
    );
    expect(timeoutMock).toHaveBeenCalledWith(35_000);
  });

  it('throws a user-visible error if the LLM is not configured', async () => {
    delete process.env.NVIDIA_API_KEY;
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(interpretSituation('I feel lonely')).rejects.toThrow(AiServiceError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws instead of returning defaults when LLM interpretation fails', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    mockNvidiaResponse(null, false, 503);

    await expect(interpretSituation('i need a movie abt my life rn')).rejects.toThrow(
      'AI interpretation failed (HTTP 503)'
    );
  });

  it('uses the LLM to choose multiple candidates and only returns IDs from TMDB', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    const timeoutMock = jest.spyOn(AbortSignal, 'timeout');
    mockNvidiaResponse(JSON.stringify({
      recommendations: [
        { id: 999, score: 100, reason: 'This movie is not part of the TMDB results.' },
        { id: 3, score: 94, reason: 'Its plot centers on isolated people forming an unexpected bond.' },
        { id: 3, score: 96, reason: 'Duplicate candidate.' },
        { id: 2, score: 69, reason: 'Too weak to recommend.' },
        { id: 1, score: 88, reason: 'The main character finds companionship while feeling alone.' },
        { id: 4, score: 82, reason: 'Its story explores connection during a lonely period.' }
      ]
    }));

    const recommendations = await selectMovieRecommendations('i feel lonley', preferences, candidates);

    expect(recommendations.map(result => result.movie.id)).toEqual([3, 1, 4]);
    expect(recommendations[0].score).toBe(94);
    expect(recommendations[0].matchReasons[0]).toContain('isolated people');
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain('Candidate 4');
    expect(timeoutMock).toHaveBeenCalledWith(35_000);
  });

  it('accepts NVIDIA tool-call arguments as structured recommendation output', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            tool_calls: [{
              function: {
                name: 'submit_result',
                arguments: JSON.stringify({
                  recommendations: [{ id: 2, score: 91, reason: 'Its central relationship closely mirrors the situation.' }]
                })
              }
            }]
          }
        }]
      })
    }) as unknown as typeof fetch;

    const recommendations = await selectMovieRecommendations('My situation', preferences, candidates);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].movie.id).toBe(2);
    expect(recommendations[0].score).toBe(91);
  });

  it('rejects invalid LLM output instead of filling in generic recommendations', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    mockNvidiaResponse('no structured response');

    await expect(interpretSituation('I need something that gets me')).rejects.toThrow(
      'AI interpretation returned invalid structured data'
    );
  });

  it('keeps a single relevant recommendation instead of padding the list', async () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    mockNvidiaResponse(JSON.stringify({
      recommendations: [{ id: 1, score: 90, reason: 'A real story match.' }]
    }));

    const recommendations = await selectMovieRecommendations('I feel lonely', preferences, candidates);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].movie.id).toBe(1);
  });
});
