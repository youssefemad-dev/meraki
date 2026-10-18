# Meraki - AI-Powered Entertainment Discovery

Meraki is an entertainment discovery application that helps users find movies based on natural-language descriptions of their movie-watching situation, mood, and preferences.

## Features

- **Natural Language Processing**: Describe your movie night situation in plain English
- **Story Similarity**: Finds films whose central relationships and plots echo your situation
- **Personalized Recommendations**: Matches real TMDB films to your story, not just a genre or mood
- **Explainable AI**: See why each movie was recommended
- **Responsive Design**: Works on desktop and mobile devices

The app uses NVIDIA's hosted model both to interpret natural-language situations and to select and explain multiple recommendations from real TMDB movie candidates. The model is prompted to understand misspellings, slang, fragments, and speech-to-text errors. There is no local-rule or popular-movie fallback: if interpretation or LLM ranking fails, the API returns an explicit error. TMDB supplies the available candidate catalog; the LLM alone decides which candidates fit the user's story. NVIDIA's hosted API catalog is intended for prototyping and evaluation; check NVIDIA's current terms before using it in production.

Movie candidates come from the LLM-generated plot keyword searches plus multiple TMDB discovery pages by interpreted genre. TMDB's catalogue is queried on demand; the app does not download or exhaustively enumerate every title in the catalogue for each request.

## Architecture

Meraki follows a client-server architecture:

### Client (Next.js Frontend)
- React 19 with Next.js 16 (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based UI with reusable components

### Server (Next.js API Routes)
- `/api/discover` - Main endpoint that processes situations and returns recommendations
- `/api/refinement` - Endpoint for refining preferences based on user feedback

### Core Components
- **Preference Interpretation**: Converts natural language to structured preferences
- **TMDB Integration**: Fetches movie data from The Movie Database API
- **Constraint Filtering**: Applies hard constraints (adult content, runtime, etc.)
- **LLM Movie Selection**: The hosted model ranks real TMDB candidates by how their plot summaries relate to the user's described situation and provides the explanations

## Getting Started

### Prerequisites
- Node.js 18.x or later
- TMDB API key (get one at [https://www.themoviedb.org/](https://www.themoviedb.org/))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### POST `/api/discover`
Processes a situation description and returns movie recommendations.

**Request:**
```json
{
  "situation": "I want to watch something romantic but not too cheesy with my partner after a long week"
}
```

**Response:**
```json
{
  "preferences": {
    "genrePreferences": ["Romance", "Drama"],
    "mood": "romantic",
    "themes": ["love", "relationships"],
    "desiredExperience": "romance",
    "intensity": "medium",
    "constraints": {
      "excludeAdultContent": true
    }
  },
  "recommendations": [
    {
      "movie": {
        "id": 12345,
        "title": "Movie Title",
        "overview": "Movie description...",
        "genre_ids": [10749, 18],
        "poster_path": "/path/to/poster.jpg",
        "release_date": "2023-05-15",
        "vote_average": 8.5,
        "vote_count": 1234,
        "runtime": 120,
        "adult": false
      },
      "score": 85.5,
      "breakdown": {
        "genreMatch": 0.8,
        "themeMatch": 0.7,
        "ratingBoost": 0.9,
        "recencyBoost": 0.8
      },
      "matchReasons": [
        "Strong genre match with Romance, Drama",
        "Themes of love, relationships align with your preferences",
        "Highly rated by audiences (8.5/10 from 1234 votes)",
        "Recent release (2023) that fits your taste for contemporary films"
      ]
    }
  ]
}
```

To rediscover with refined preferences without reinterpreting natural language, send a validated `preferences` object instead of `situation`:
```json
{
  "preferences": {/* current interpreted preferences */}
}
```

### POST `/api/refinement`
Refines existing preferences based on user feedback.

**Request:**
```json
{
  "preferences": {/* current preferences object */},
  "action": {
    "type": "SET_MOOD",
    "mood": "energetic"
  }
}
```

**Response:**
```json
{
  "preferences": {/* updated preferences object */ }
}
```

## Component Library

### UI Components
- `LoadingState` - Shows contextual messages during different loading states
- `RecommendationCard` - Displays movie information with score and match reasons
- `RecommendationSkeleton` - Placeholder UI while content is loading

### Key Features
- All components are fully responsive
- Dark mode compatible
- Accessible with proper ARIA labels and keyboard navigation
- Animated loading states for better UX

## Refinement System

Meraki's refinement system allows users to iteratively improve their movie recommendations:

1. **Initial Discovery**: User describes a situation → Get initial recommendations
2. **Preference Adjustment**: User can adjust:
   - Desired experience (e.g., from "romance" to "excitement")
   - Mood (e.g., from "relaxed" to "energetic")
   - Intensity (low, medium, high)
   - Add themes they're interested in
   - Add content they want to avoid
3. **Re-discovery**: System gets new recommendations based on updated preferences
4. **Repeat**: User can continue refining until they find the perfect movie

## Testing

### Unit Tests
- Located alongside components in `__tests__` directories
- Run with: `npm test`

### End-to-End Tests
- Cypress tests in `cypress/e2e/` directory
- To install Cypress: `npm install --save-dev cypress`
- To run: `npx cypress open` or `npx cypress run`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. In **Project Settings → Environment Variables**, add `TMDB_API_KEY` with the TMDB key as its value. Enable it for Production and Preview (and Development if using Vercel CLI).
4. Also add `NVIDIA_API_KEY` to enable both hosted LLM interpretation and movie selection; set `NVIDIA_MODEL` to a model available to your NVIDIA account if the default model is unavailable. The app will show an explicit error if AI is unavailable; it will not silently return generic recommendations.
5. Deploy or redeploy after adding/changing the variables. Vercel injects them into the server-side functions at runtime.

Do not add the key to `vercel.json`, client-side code, or a committed file. For local development, put it in the Git-ignored `.env.local` file in the project root.

### Other Platforms
Meraki can be deployed to any platform that supports Next.js applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass
5. Submit a pull request

## License

MIT
