# Meraki Design Specification
## AI-Powered Entertainment Discovery App

**Date**: 2026-10-14  
**Project**: Meraki (Next.js 16.4.0 with TypeScript, Tailwind CSS v4)  
**MVP Scope**: Movie-focused entertainment discovery with natural language input  

## 1. Architecture Overview
```
Frontend: Next.js 16.4.0 (App Router) with TypeScript, Tailwind CSS v4
Backend: Next.js Route Handlers (app/api/discover/route.ts) for orchestrated discovery flow
External APIs: TMDB (movie data), LLM provider (preference extraction & optional explanations)
State: React hooks/context (or useReducer) for client-side discovery state
Styling: Tailwind CSS for responsive, accessible UI
```
Orchestration keeps discovery flow server-controlled: single endpoint handles interpretation, matching, and explanation, reducing client complexity and ensuring validation.

## 2. Core Components & Data Flow
**Key Components**:
- `SituationInput`: Textarea with character counter, submit button, example prompts
- `EntertainmentTypeSelector`: Horizontal radio group (Movies active, TV/Music grayed out for MVP)
- `RecommendationGrid`: Responsive grid of `RecommendationCard` components (2-3 columns)
- `RecommendationCard`: Poster, title, year, genres, runtime, rating, explanation text
- `RefinementBar`: Chip-like buttons for quick feedback ("Less melancholic", "More comforting", etc.)
- `LoadingIndicator` & `ErrorMessage`: For handling async states
- `RecommendationResults`: Owns results section with empty, loading, and populated states

**Data Flow (User Journey)**:
1. User lands on homepage, sees brief value proposition and "Get Started" button
2. Clicks to enter discovery flow (or lands directly on selector)
3. Selects "Movies" (pre-selected in MVP)
4. Types natural language situation in textarea (e.g., "I need a break from work stress...")
5. Clicks "Get Recommendations" button
6. Frontend sets state to `interpreting`, calls `/api/discover` with situation text
7. Backend orchestrates:
   a. Calls LLM with prompt to extract structured preferences (including constraints) from situation text, validating output against Zod schema
   b. If LLM output invalid, retries once with constrained correction prompt; if still invalid, returns recoverable error
   c. Uses validated preferences to fetch candidate movies from TMDB:
        - Uses TMDB discover/search with genre filters (from preferences.genrePreferences) as primary signal
        - Supplements with popular/popular movies and/or top-rated movies to ensure diverse candidate pool
        - Applies hard constraints server-side: excludes adult content if `constraints.excludeAdultContent` is true
        - (Optional) Filters by maxRuntimeMinutes after fetching movie details (requires additional TMDB requests)
        - (Optional) Filters by release year range
   d. Scores each candidate movie using deterministic ranking function:
        - genreMatch: proportion of preferred genres present in movie
        - themeMatch: presence of preference themes in movie overview (keyword match)
        - ratingBoost: normalized vote average, weighted by vote_count (Bayesian average)
        - recencyBoost: normalized release year (newer films get slight boost)
        - Total score = weighted sum (0-100), weights documented and configurable
   e. Returns top 6 movies sorted by score, with matchReasons (evidence-based strings from breakdown)
   f. Generates explanations:
        - For MVP: deterministic templates using matchReasons and movie metadata (e.g., "Recommended for its [genreMatch] and [themeMatch], aligning with your preference for [desiredExperience].")
        - (Optional) Batched LLM request for explanations if deterministic versions prove insufficient, validated against schema
8. Frontend receives response, sets state to `success` with recommendations
9. Frontend displays recommendation grid with cards
10. User can click refinement buttons (which modify preferences and repeat from step 6)
11. User can restart with new situation at any time (resets state to `idle`)

## 3. TypeScript Types & Interfaces
```typescript
// Controlled values for inferred preferences
type Pace = 'slow' | 'medium' | 'fast';
type Intensity = 'low' | 'medium' | 'high';

type Mood =
  | 'hopeful'
  | 'melancholic'
  | 'energetic'
  | 'peaceful'
  | 'nostalgic'
  | 'tense'
  | 'playful'
  | 'reflective';

type DesiredExperience =
  | 'comfort'
  | 'distraction'
  | 'reflection'
  | 'inspiration'
  | 'excitement'
  | 'emotional-release'
  | 'escapism';

// Explicit requirements vs. inferred preferences
interface InterpretedPreferences {
  genrePreferences: string[];
  mood: Mood | null;
  themes: string[];
  pace: Pace | null;
  contentToAvoid: string[];
  desiredExperience: DesiredExperience | null;
  intensity: Intensity | null;
  constraints: {
    excludeAdultContent: boolean;
    maxRuntimeMinutes?: number;
    releaseYearFrom?: number;
    releaseYearTo?: number;
    // Additional constraints can be added as needed
  };
}

// Normalized TMDB movie model (after fetching and transforming)
interface TmdbMovie {
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

// Scored movie recommendation
interface RecommendationScore {
  movie: TmdbMovie;
  // Normalized overall score: 0-100
  score: number;
  breakdown: {
    genreMatch: number;      // 0-1 (proportion of preferred genres present)
    themeMatch: number;      // 0-1 (keyword match in overview)
    ratingBoost: number;     // 0-1 (normalized vote average, weighted by vote_count)
    recencyBoost: number;    // 0-1 (newer release bonus)
  };
  // Evidence-grounded reasons for the match (derived from breakdown)
  matchReasons: string[];
}

// Refinement actions (structured controls for MVP)
type RefinementAction =
  | { type: 'SET_DESIRED_EXPERIENCE'; value: DesiredExperience }
  | { type: 'SET_MOOD'; value: Mood }
  | { type: 'SET_INTENSITY'; value: Intensity }
  | { type: 'ADD_THEME'; value: string }
  | { type: 'ADD_CONTENT_TO_AVOID'; value: string }
  | { type: 'REMOVE_CONTENT_TO_AVOID'; value: string }
  | { type: 'RESET' };

// API request/response types for /api/discover
interface DiscoverRequest {
  situation?: string;
  preferences?: InterpretedPreferences;
}
interface DiscoverResponse {
  recommendations: RecommendationScore[];
  // Includes interpretation transparency for debugging and refinement
  preferences?: InterpretedPreferences;
}
```

Send either `situation` for a new natural-language discovery or validated `preferences` to rediscover after a refinement action. The latter preserves structured constraints without interpreting them a second time.

## 4. Error Handling, Loading States, and Testing Considerations

**Error Handling**:
- API errors (LLM, TMDB): Show user-friendly error messages with retry option; log technical details and correlation ID
- Validation errors: If LLM output fails schema validation, retry once with constrained correction prompt; if still fails, return recoverable error (do not invent preferences)
- Network errors: Display connection error message with retry button
- Unexpected errors: Global error boundary for rendering failures; API/async errors handled explicitly in request flow
- Degraded mode: No silent fallback to mock data in production; mock data only used in development or clearly labeled demo mode

**Loading States**:
- Client-side state machine: `idle` | `interpreting` | `matching` | `explaining` | `success` | `error`
- Contextual messages per state:
  - `interpreting`: "Understanding your situation..."
  - `matching`: "Finding movies that match..."
  - `explaining`: "Generating explanations..." (if using LLM explanations)
- Skeleton UI for recommendation cards while in `matching` or `explaining` states
- Disable submit button during `interpreting`, `matching`, `explaining` to prevent duplicate requests; also prevent stale responses from overwriting results after new search/restart

**Testing Strategy**:
- Unit tests:
  - Preference parsing and validation (Zod schema)
  - Hard-constraint filtering (adult content, runtime, release year)
  - Ranking algorithm (genreMatch, themeMatch, ratingBoost, recencyBoost) with fixed weights
  - Refinement action reducers
  - Utility functions (date parsing, string matching)
- Integration tests:
  - API routes with mocked external services (LLM, TMDB)
  - Invalid provider output, timeouts, empty candidate lists, partial failures
  - End-to-end API flow: discover → recommendations
- End-to-end tests (Playwright/Cypress):
  - Complete user journey: input scenario → get recommendations → refine → restart
  - Keyboard accessibility and narrow-screen layouts
  - Error states: network failure, API timeout, invalid input
  - Deterministic ranking test: given same candidates and preferences, ranking function produces identical ordered results
- Manual testing:
  - Test with diverse user scenarios from pasted content
  - Verify explanations are grounded in actual movie metadata (no invented plot details)
  - Check refinement actions update results as expected

## 5. Non-Goals (Deferred for Post-MVP)
- User accounts and authentication
- Persistent storage of preferences or history
- Social features (sharing, liking, commenting)
- Public reviews/rating integration
- Advanced recommendation models (collaborative filtering, embeddings)
- Multiple external music integrations (Spotify, Apple Music)
- Actual playlist creation in streaming services
- Recommendation history and personalization
- Native mobile applications (React Native)
- Administrative dashboards or analytics

## 6. Success Criteria for MVP
- Users can describe their situation in natural language and receive relevant movie recommendations
- Explanations clearly connect movie attributes to user's stated preferences (no invented claims)
- Refinement actions allow iterative improvement without restarting
- UI is polished, responsive, and accessible
- Error states are handled gracefully with clear messaging
- Core loop (input → interpretation → matching → explanation → refinement) works end-to-end
- Demonstrates engineering ability through clean architecture, type safety, and testability