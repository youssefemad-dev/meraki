import { NextResponse } from 'next/server';
import { TMDBClient } from '@/lib/tmdb/client';
import { normalizeMovie } from '@/lib/tmdb/normalize';
import { applyHardConstraints } from '@/lib/recommendations/filter';
import { InterpretedPreferences } from '@/lib/schemas/preferences';
import type { InterpretedPreferences as InterpretedPreferencesType } from '@/lib/schemas/preferences';
import { AiServiceError, interpretSituation, selectMovieRecommendations } from '@/lib/interpretation/llmService';

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'A valid request body is required' },
        { status: 400 }
      );
    }

    const { situation, preferences: suppliedPreferences } = body as {
      situation?: unknown;
      preferences?: unknown;
    };

    let preferences: InterpretedPreferencesType;
    if (suppliedPreferences !== undefined) {
      const parsedPreferences = InterpretedPreferences.safeParse(suppliedPreferences);
      if (!parsedPreferences.success) {
        return NextResponse.json(
          { error: 'Valid preferences are required' },
          { status: 400 }
        );
      }
      preferences = parsedPreferences.data;
    } else if (typeof situation === 'string' && situation.trim()) {
      preferences = await interpretSituation(situation);
    } else {
      return NextResponse.json(
        { error: 'Situation description is required' },
        { status: 400 }
      );
    }

    // Step 2: Fetch movies from TMDB based on genre preferences
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TMDB API key is not configured' },
        { status: 500 }
      );
    }
    const tmdbClient = new TMDBClient(apiKey);

    // Convert genre preferences to TMDB genre IDs
    const genreNameToIdMap: Record<string, number> = {
      'Action': 28,
      'Adventure': 12,
      'Animation': 16,
      'Comedy': 35,
      'Crime': 80,
      'Documentary': 99,
      'Drama': 18,
      'Family': 10751,
      'Fantasy': 14,
      'History': 36,
      'Horror': 27,
      'Music': 10402,
      'Mystery': 9648,
      'Romance': 10749,
      'Science Fiction': 878,
      'TV Movie': 10770,
      'Thriller': 53,
      'War': 10752,
      'Western': 37
    };

    const genreIds = preferences.genrePreferences
      .map(genre => genreNameToIdMap[genre])
      .filter((id): id is number => id !== undefined);

    const genreSearches = [...new Set(genreIds)].flatMap(id => [
      tmdbClient.fetchDiscoverMovies([id], { page: 1 }),
      tmdbClient.fetchDiscoverMovies([id], { page: 2 }),
      tmdbClient.fetchDiscoverMovies([id], {
        page: 1,
        sortBy: 'vote_average.desc',
        minVoteCount: 100
      })
    ]);
    const storyQueries = [...new Set(preferences.storyKeywords ?? [])].slice(0, 4);
    const storyReferences = [...new Set(preferences.storyReferences ?? [])].slice(0, 5);
    const tmdbResponses: Awaited<ReturnType<typeof tmdbClient.searchMovies>>[] = [];
    if (storyReferences.length > 0) {
      tmdbResponses.push(...await Promise.all(storyReferences.map(title => tmdbClient.searchMovies(title))));
    }
    if (storyQueries.length > 0) {
      const targetedQueries = storyQueries;
      const [keywordSearches, movieSearches] = await Promise.all([
        Promise.all(targetedQueries.map(query => tmdbClient.searchKeyword(query))),
        Promise.all(targetedQueries.map(query => tmdbClient.searchMovies(query)))
      ]);
      tmdbResponses.push(...movieSearches);
      const keywordIds = [...new Set(keywordSearches.flatMap(results => results.slice(0, 2).map(result => result.id)))];
      if (keywordIds.length > 0) {
        tmdbResponses.push(await tmdbClient.fetchMoviesByKeywords(keywordIds));
      }
    }
    tmdbResponses.push(...await Promise.all(genreSearches));

    // Normalize TMDB responses
    const movies = [...new Map(tmdbResponses.flat().map(movie => [movie.id, movie])).values()];
    const normalizedMovies = movies.map(normalizeMovie);

    // Step 3: Apply hard constraints
    const filteredMovies = applyHardConstraints(normalizedMovies, preferences.constraints);

    // Let the LLM select and explain every recommended movie from real TMDB candidates.
    const recommendations = await selectMovieRecommendations(
      typeof situation === 'string' ? situation : preferences.situationSummary ?? '',
      preferences,
      filteredMovies
    );

    return NextResponse.json({
      preferences,
      recommendations
    });
  } catch (error) {
    if (error instanceof AiServiceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Error in discover API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
