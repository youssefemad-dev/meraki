import { NextResponse } from 'next/server';
import { TMDBClient } from '@/lib/tmdb/client';
import { normalizeMovie } from '@/lib/tmdb/normalize';
import { applyHardConstraints } from '@/lib/recommendations/filter';
import { scoreAndRankMovies, RecommendationScore } from '@/lib/recommendations/score';
import { InterpretedPreferences } from '@/lib/schemas/preferences';
import { interpretSituation } from '@/lib/interpretation/llmService';

export async function POST(request: Request) {
  try {
    const { situation } = await request.json();

    if (!situation || typeof situation !== 'string') {
      return NextResponse.json(
        { error: 'Situation description is required' },
        { status: 400 }
      );
    }

    // Step 1: Interpret preferences from situation description
    const preferences = await interpretSituation(situation);

      // Validate with Zod schema (would throw if invalid)
      // In a real implementation, we'd use the actual Zod schema from '@/lib/schemas/preferences'
      // For now, we'll assume our mock function returns valid preferences
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to interpret preferences from situation' },
        { status: 400 }
      );
    }

    // Step 2: Fetch movies from TMDB based on genre preferences
    const tmdbClient = new TMDBClient(process.env.TMDB_API_KEY!);

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

    // If no valid genre IDs, use a default popular genre
    const effectiveGenreIds = genreIds.length > 0 ? genreIds : [28]; // Default to Action

    // Fetch discover movies
    const tmdbResponse = await tmdbClient.fetchDiscoverMovies(effectiveGenreIds, { page: 1 });

    // Normalize TMDB responses
    const movies: any[] = Array.isArray(tmdbResponse.results) ? tmdbResponse.results : [];
    const normalizedMovies = movies.map(normalizeMovie);

    // Step 3: Apply hard constraints
    const filteredMovies = applyHardConstraints(normalizedMovies, preferences.constraints);

    // Step 4: Score and rank movies
    const scoredMovies: RecommendationScore[] = scoreAndRankMovies(filteredMovies, preferences);

    // Step 5: Take top 10 recommendations
    const topRecommendations = scoredMovies.slice(0, 10);

    // Step 6: Format response
    return NextResponse.json({
      preferences, // Return the interpreted preferences for transparency
      recommendations: topRecommendations.map(rec => ({
        id: rec.movie.id,
        title: rec.movie.title,
        overview: rec.movie.overview,
        poster_path: rec.movie.poster_path,
        release_date: rec.movie.release_date,
        vote_average: rec.movie.vote_average,
        vote_count: rec.movie.vote_count,
        runtime: rec.movie.runtime,
        score: rec.score,
        matchReasons: rec.matchReasons
      }))
    });
  } catch (error) {
    console.error('Error in discover API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}