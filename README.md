# Meraki - AI-Powered Entertainment Discovery

Meraki is an AI-powered entertainment discovery application that helps users find movies based on natural language descriptions of their movie-watching situation, mood, and preferences.

## Features

- **Natural Language Processing**: Describe your movie night situation in plain English
- **AI-Powered Interpretation**: Understands your preferences, mood, and desired experience
- **Personalized Recommendations**: Gets movies that match your specific context
- **Refinement System**: Iteratively improve results by adjusting preferences
- **Explainable AI**: See why each movie was recommended
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light mode based on system preferences

## Architecture

Meraki follows a client-server architecture:

### Client (Next.js Frontend)
- React 18 with Next.js 16 (App Router)
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
- **Scoring Algorithm**: Ranks movies based on genre match, theme match, rating, and recency
- **Refinement System**: Allows iterative preference adjustment

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
      "id": 12345,
      "title": "Movie Title",
      "overview": "Movie description...",
      "poster_path": "/path/to/poster.jpg",
      "release_date": "2023-05-15",
      "vote_average": 8.5,
      "vote_count": 1234,
      "runtime": 120,
      "score": 85.5,
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
- `RefinementPanel` - Controls for adjusting preferences to refine results

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
3. Add `TMDB_API_KEY` environment variable
4. Deploy

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
