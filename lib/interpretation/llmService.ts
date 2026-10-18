import {
  DesiredExperience,
  InterpretedPreferences,
  Mood,
  type InterpretedPreferences as InterpretedPreferencesType
} from '../schemas/preferences';
import type { RecommendationScore } from '../recommendations/score';
import type { TmdbMovie } from '../tmdb/normalize';

export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

const knownGenres = new Set([
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama',
  'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance',
  'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
]);
const INTERPRETATION_TIMEOUT_MS = 35_000;
const RECOMMENDATION_TIMEOUT_MS = 35_000;

function parseModelJson(content: string): Record<string, unknown> | null {
  const clean = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    const value: unknown = JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

async function requestNvidiaJson(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  task: string,
  schema: Record<string, unknown>,
  maxTokens: number,
  timeoutMs: number
): Promise<Record<string, unknown>> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new AiServiceError('AI recommendations are unavailable because NVIDIA_API_KEY is not configured on the server.');
  }

  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b';
  let response: Response;
  try {
    response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages,
        tools: [{
          type: 'function',
          function: {
            name: 'submit_result',
            description: `Return the structured ${task} result.`,
            parameters: schema
          }
        }],
        tool_choice: { type: 'function', function: { name: 'submit_result' } },
        ...(model.includes('nemotron-3-super')
          ? { chat_template_kwargs: { enable_thinking: false } }
          : {})
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'Unknown error';
    console.error(`NVIDIA ${task} request could not be completed (${reason}).`);
    throw new AiServiceError(`AI ${task} is temporarily unavailable. Please try again.`);
  }

  if (!response.ok) {
    console.error(`NVIDIA ${task} request failed with HTTP ${response.status}.`);
    throw new AiServiceError(`AI ${task} failed (HTTP ${response.status}). Please try again later.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    console.error(`NVIDIA ${task} response was not valid JSON.`);
    throw new AiServiceError(`AI ${task} returned an invalid response. Please try again.`);
  }

  if (!payload || typeof payload !== 'object') {
    throw new AiServiceError(`AI ${task} returned an invalid response. Please try again.`);
  }
  const choices = (payload as { choices?: unknown }).choices;
  const message = Array.isArray(choices) && choices[0] && typeof choices[0] === 'object'
    ? (choices[0] as { message?: { content?: unknown; tool_calls?: unknown } }).message
    : undefined;
  const toolCalls = message?.tool_calls;
  if (Array.isArray(toolCalls)) {
    for (const call of toolCalls) {
      if (!call || typeof call !== 'object') continue;
      const fn = (call as { function?: { name?: unknown; arguments?: unknown } }).function;
      if (fn?.name !== 'submit_result') continue;
      if (fn.arguments && typeof fn.arguments === 'object' && !Array.isArray(fn.arguments)) {
        return fn.arguments as Record<string, unknown>;
      }
      if (typeof fn.arguments === 'string') {
        const parsedArguments = parseModelJson(fn.arguments);
        if (parsedArguments) return parsedArguments;
      }
    }
  }
  const rawContent = message?.content;
  const content = typeof rawContent === 'string'
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent
        .filter((part): part is { text: string } => Boolean(part && typeof part === 'object' && 'text' in part && typeof part.text === 'string'))
        .map(part => part.text)
        .join('')
      : '';
  const parsed = content ? parseModelJson(content) : null;
  if (!parsed) {
    console.error(`NVIDIA ${task} response was missing valid structured content.`);
    throw new AiServiceError(`AI ${task} returned invalid structured data. Please try again.`);
  }
  return parsed;
}

function getStrings(value: unknown, max: number, maxLength = 80): string[] {
  return Array.isArray(value)
    ? value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => item.slice(0, maxLength))
      .slice(0, max)
    : [];
}

export async function interpretSituation(situation: string): Promise<InterpretedPreferencesType> {
  const parsed = await requestNvidiaJson([
    {
      role: 'system',
      content: 'You are an expert movie-story interpreter. The user may use misspellings, typos, slang, fragments, speech-to-text errors, or informal language. Silently infer the most likely intended meaning from context; do not reject or copy errors. If genuinely ambiguous, make a reasonable conservative interpretation and state it briefly in situationSummary. Identify the emotional need and what kind of movie story would resonate, not just a genre or mood. Write situationSummary as one concise, empathetic sentence addressed directly to the user as “you”; never say “the user” or describe their feelings in detached third person. Return one JSON object with situationSummary (empathetic concise sentence), genrePreferences (1-3 standard movie genres), storySignals (2-5 kebab-case narrative concepts), storyKeywords (4-8 concrete TMDB-searchable plot phrases), storyReferences (1-5 existing film titles with a notably similar central relationship or plot, for candidate discovery only; prioritize close narrative analogues, not genre matches), themes (2-5), mood (supported controlled mood or null), pace (slow/medium/fast/moderate or null), intensity (low/medium/high or null), desiredExperience (supported controlled value or null), contentToAvoid (array), constraints (object with excludeAdultContent boolean and optional maxRuntimeMinutes/releaseYearFrom/releaseYearTo). Never return empty genrePreferences, storyKeywords, and themes together. Preserve story specifics and do not invent user restrictions.'
    },
    { role: 'user', content: situation }
  ], 'interpretation', {
    type: 'object', additionalProperties: false,
    properties: {
      situationSummary: { type: 'string' }, genrePreferences: { type: 'array', items: { type: 'string', enum: [...knownGenres] } },
      storySignals: { type: 'array', items: { type: 'string' } }, storyKeywords: { type: 'array', items: { type: 'string' } },
      storyReferences: { type: 'array', items: { type: 'string' } },
      themes: { type: 'array', items: { type: 'string' } }, mood: { type: ['string', 'null'] },
      pace: { type: ['string', 'null'] }, intensity: { type: ['string', 'null'] }, desiredExperience: { type: ['string', 'null'] },
      contentToAvoid: { type: 'array', items: { type: 'string' } },
      constraints: { type: 'object', additionalProperties: false, properties: {
        excludeAdultContent: { type: 'boolean' }, maxRuntimeMinutes: { type: 'integer' },
        releaseYearFrom: { type: 'integer' }, releaseYearTo: { type: 'integer' }
      }, required: ['excludeAdultContent'] }
    },
    required: ['situationSummary', 'genrePreferences', 'storySignals', 'storyKeywords', 'storyReferences', 'themes', 'mood', 'pace', 'intensity', 'desiredExperience', 'contentToAvoid', 'constraints']
  }, 1200, INTERPRETATION_TIMEOUT_MS);

  const genrePreferences = Array.isArray(parsed.genrePreferences)
    ? parsed.genrePreferences
      .filter((item): item is string => typeof item === 'string' && knownGenres.has(item))
      .slice(0, 5)
    : [];
  const mood = typeof parsed.mood === 'string'
    ? Mood.find(value => value === parsed.mood) ?? null
    : null;
  const pace = typeof parsed.pace === 'string' &&
    ['slow', 'medium', 'fast', 'moderate'].includes(parsed.pace)
    ? parsed.pace as InterpretedPreferencesType['pace']
    : null;
  const intensity = typeof parsed.intensity === 'string' &&
    ['low', 'medium', 'high'].includes(parsed.intensity)
    ? parsed.intensity as InterpretedPreferencesType['intensity']
    : null;
  const desiredExperience = typeof parsed.desiredExperience === 'string'
    ? DesiredExperience.find(value => value === parsed.desiredExperience) ?? null
    : null;
  const constraintsValue = parsed.constraints && typeof parsed.constraints === 'object'
    ? parsed.constraints
    : {};
  const rawConstraints = constraintsValue as Record<string, unknown>;
  const constraints = {
    excludeAdultContent: typeof rawConstraints.excludeAdultContent === 'boolean'
      ? rawConstraints.excludeAdultContent
      : true,
    ...(typeof rawConstraints.maxRuntimeMinutes === 'number'
      ? { maxRuntimeMinutes: rawConstraints.maxRuntimeMinutes }
      : {}),
    ...(typeof rawConstraints.releaseYearFrom === 'number'
      ? { releaseYearFrom: rawConstraints.releaseYearFrom }
      : {}),
    ...(typeof rawConstraints.releaseYearTo === 'number'
      ? { releaseYearTo: rawConstraints.releaseYearTo }
      : {})
  };
  const preferences = InterpretedPreferences.safeParse({
    situationSummary: typeof parsed.situationSummary === 'string'
      ? parsed.situationSummary.trim().slice(0, 240)
      : '',
    genrePreferences,
    storySignals: getStrings(parsed.storySignals, 8, 60),
    storyKeywords: getStrings(parsed.storyKeywords, 8),
    storyReferences: getStrings(parsed.storyReferences, 5, 100),
    themes: getStrings(parsed.themes, 8),
    mood,
    pace,
    intensity,
    desiredExperience,
    contentToAvoid: getStrings(parsed.contentToAvoid, 8),
    constraints
  });

  if (!preferences.success || !preferences.data.situationSummary ||
      (!preferences.data.storyKeywords?.length && !preferences.data.themes.length)) {
    console.error('NVIDIA interpretation response did not contain valid, actionable preferences.');
    throw new AiServiceError('AI could not confidently interpret that situation. Try rephrasing it with a little more context.');
  }
  return preferences.data;
}

export async function selectMovieRecommendations(
  situation: string,
  preferences: InterpretedPreferencesType,
  candidates: TmdbMovie[]
): Promise<RecommendationScore[]> {
  if (candidates.length < 3) {
    throw new AiServiceError('TMDB returned fewer than three movie candidates. Please try again later.');
  }
  const candidatePool = candidates.slice(0, 40).map(movie => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) ?? '',
    genres: movie.genre_ids,
    rating: movie.vote_average,
    overview: (movie.overview ?? '').slice(0, 400)
  }));
  const parsed = await requestNvidiaJson([
    {
      role: 'system',
      content: 'You are the movie recommender. Select up to 6 distinct movies ONLY from the supplied TMDB candidates. Compare the core relationships and events in each candidate overview to the user situation. A shared genre or broad theme (such as family, love, or drama) is not enough: the central story must meaningfully resemble the situation. Use referenced films only to help locate the right kind of story; do not recommend a referenced title unless it is in the candidate list. Return JSON: {"recommendations":[{"id":integer,"score":integer 0-100,"reason":"specific explanation of how this movie plot relates to the user"}]}. Sort best match first. Never invent titles, IDs, or plot details. Never recommend a movie based only on genre, popularity, rating, title keyword coincidence, or unrelated plot details. Be typo-tolerant about the original input. Score 90-100 for near-identical central dynamics, 80-89 for very close story parallels, 70-79 for clear meaningful parallels; omit anything below 70. Return only genuinely fitting candidates; an empty list is better than padding with irrelevant choices.'
    },
    {
      role: 'user',
      content: JSON.stringify({
        situation,
        interpretedNeeds: {
          summary: preferences.situationSummary,
          genres: preferences.genrePreferences,
          storySignals: preferences.storySignals,
          storyKeywords: preferences.storyKeywords,
          storyReferences: preferences.storyReferences,
          themes: preferences.themes,
          mood: preferences.mood,
          desiredExperience: preferences.desiredExperience
        },
        candidates: candidatePool
      })
    }
  ], 'movie recommendations', {
    type: 'object', additionalProperties: false,
    properties: {
      recommendations: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false,
        properties: { id: { type: 'integer' }, score: { type: 'integer' }, reason: { type: 'string' } },
        required: ['id', 'score', 'reason']
      } }
    }, required: ['recommendations']
  }, 1400, RECOMMENDATION_TIMEOUT_MS);

  if (!Array.isArray(parsed.recommendations)) {
    console.error('NVIDIA movie recommendation response did not contain a recommendations array.');
    throw new AiServiceError('AI returned an invalid movie recommendation list. Please try again.');
  }
  const candidatesById = new Map(candidates.map(movie => [movie.id, movie]));
  const seen = new Set<number>();
  const recommendations: RecommendationScore[] = [];
  for (const value of parsed.recommendations) {
    if (!value || typeof value !== 'object') continue;
    const pick = value as Record<string, unknown>;
    const id = typeof pick.id === 'number' ? pick.id : Number(pick.id);
    const movie = candidatesById.get(id);
    if (!movie || seen.has(id) || typeof pick.reason !== 'string' || !pick.reason.trim()) continue;
    const score = typeof pick.score === 'number' && Number.isFinite(pick.score)
      ? Math.max(0, Math.min(100, pick.score))
      : 0;
    if (score < 70) continue;
    seen.add(id);
    recommendations.push({
      movie,
      score,
      breakdown: { storyMatch: score / 100, genreMatch: 0, themeMatch: 0, ratingBoost: 0, recencyBoost: 0 },
      matchReasons: [pick.reason.trim().slice(0, 240)]
    });
    if (recommendations.length === 6) break;
  }
  if (recommendations.length === 0) {
    console.error(`NVIDIA returned only ${recommendations.length} valid movie recommendations.`);
    throw new AiServiceError('AI could not find a relevant movie in the search results. Try another description.');
  }
  return recommendations;
}
