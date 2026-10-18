<div align="center">

# Meraki

### Find a film that feels close to your story.

Meraki turns a thought, a difficult day, or a very specific feeling into movie recommendations chosen for **story similarity**—not just a shared genre or mood.

</div>

---

## The idea

Most movie finders ask what genre you want. Meraki starts with what is happening in your life. Describe it in your own words, and the app looks for films whose characters, relationships, and plot echo that situation.

> “My mom loves me but doesn’t like me.” → *Lady Bird* and other stories about complicated parent–child relationships.

## What it does

- Accepts natural-language descriptions, including informal wording and typos.
- Interprets the underlying story and emotional themes with an NVIDIA-hosted LLM.
- Searches TMDB for real movie candidates using plot keywords, reference titles, and relevant genres.
- Ranks candidates by how closely their actual plot summaries fit the situation.
- Explains each match and filters out weak matches instead of padding the list.
- Presents the results in a responsive, story-first interface.

## System design

![Meraki system architecture: user input flows through the Next.js app, NVIDIA LLM, and TMDB before story-matched films are returned.](docs/images/meraki-system-architecture.jfif)

## Recommendation flow

1. **Interpret:** The LLM translates the situation into story signals, searchable plot language, themes, and optional reference films.
2. **Retrieve:** The server searches TMDB by those references and story keywords, then adds genre-based candidates.
3. **Filter:** Explicit constraints, such as adult-content exclusion or runtime limits, are applied to the TMDB results.
4. **Rank:** The LLM compares candidate overviews with the original situation and returns only close story matches with specific reasons.
5. **Present:** The app shows the selected films and the interpretation that guided the search.

All displayed films come from TMDB candidates. If the AI service is unavailable or cannot find a close match, the app reports that instead of silently substituting generic recommendations.

## Built with

| Area | Tools |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| Interface | Tailwind CSS, custom responsive CSS |
| Input validation | Zod |
| Movie catalogue | TMDB API |
| Language model | NVIDIA hosted chat completions API |
| Quality checks | Jest, Testing Library, TypeScript |

## Run locally

### Requirements

- Node.js and npm
- A TMDB API key
- An NVIDIA API key with access to a supported chat-completions model

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your server-side API keys:

   ```env
   TMDB_API_KEY=your_tmdb_api_key
   NVIDIA_API_KEY=your_nvidia_api_key
   # Optional: defaults to nvidia/nemotron-3-super-120b-a12b
   NVIDIA_MODEL=nvidia/nemotron-3-super-120b-a12b
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Keep credentials in `.env.local`. It is ignored by Git; never use a `NEXT_PUBLIC_` prefix for these server keys.

## Useful commands

```bash
npm run dev       # Start the local development server
npm run lint      # Run ESLint
npm test          # Run the Jest test suite
npm run build     # Create a production build
```

## API

### `POST /api/discover`

Pass a free-form situation:

```json
{
  "situation": "My mom loves me but doesn't like me."
}
```

The response contains the interpreted preferences and a list of TMDB-backed movie recommendations, each with a story-match score and explanation. A validated `preferences` object can also be sent when rediscovering from an already interpreted situation.

### `POST /api/refinement`

An API endpoint for updating interpreted preferences. The current website intentionally keeps the discovery flow focused and does not show a refinement panel.

## Project map

```text
app/
  api/discover/       Story interpretation, TMDB retrieval, and LLM ranking
  api/refinement/     Preference refinement endpoint
  globals.css         Design system and responsive styles
  page.tsx            Story-first discovery experience
components/ui/        Recommendation and loading components
lib/
  interpretation/     NVIDIA LLM requests and response validation
  recommendations/    Candidate filtering and scoring types
  schemas/            Validated preference contracts
  tmdb/               TMDB client and movie normalization
docs/
  superpowers/        Product design and implementation notes
```

## Development workflow

The project was developed with an **agentic workflow**. Work was split across multiple AI agents for parallel exploration and implementation support, then consolidated into a single product flow. The final integration kept the LLM, TMDB retrieval, validation, and interface working together as one end-to-end experience.


## Movie data

Movie metadata and poster images are provided by [The Movie Database (TMDB)](https://www.themoviedb.org/). This project is not endorsed or certified by TMDB.
