import { fireEvent, render, screen } from '@testing-library/react';
import Home from './page';

describe('story-first discovery page', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn()
    });
  });

  it('lets someone use an example as their starting story', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'I miss how close my sister and I used to be.' }));

    expect(screen.getByRole('textbox', { name: 'What’s your story tonight?' })).toHaveValue(
      'I miss how close my sister and I used to be.'
    );
  });

  it('sends the situation to discovery and shows the story-matched film and explanation', async () => {
    const situation = 'My mom loves me but doesn’t like me.';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        preferences: {
          situationSummary: 'You want a story about love complicated by friction with your mom.',
          genrePreferences: ['Drama'],
          storySignals: ['mother-daughter-conflict'],
          storyKeywords: ['mother daughter relationship'],
          storyReferences: ['Lady Bird'],
          mood: 'thoughtful',
          themes: ['family', 'independence'],
          pace: null,
          contentToAvoid: [],
          desiredExperience: 'reflection',
          intensity: null,
          constraints: { excludeAdultContent: true }
        },
        recommendations: [{
          movie: {
            id: 391713,
            title: 'Lady Bird',
            overview: 'A teenager navigates a complicated relationship with her mother.',
            genre_ids: [18],
            release_date: '2017-09-01',
            vote_average: 7.4,
            vote_count: 1000,
            popularity: 100,
            runtime: 94,
            adult: false,
            poster_path: null
          },
          score: 91,
          breakdown: { storyMatch: 0.91, genreMatch: 0, themeMatch: 0, ratingBoost: 0, recencyBoost: 0 },
          matchReasons: ['The mother-daughter bond is affectionate, combative, and shaped by a push for independence.']
        }]
      })
    } as Response) as unknown as typeof fetch;

    render(<Home />);
    fireEvent.change(screen.getByRole('textbox', { name: 'What’s your story tonight?' }), {
      target: { value: situation }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find my film' }));

    expect(await screen.findByRole('heading', { name: 'Lady Bird' })).toBeInTheDocument();
    expect(screen.getByText(/affectionate, combative, and shaped by a push for independence/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/discover', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ situation })
    }));
  });

  it('shows the AI service error instead of fake or generic recommendations', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'AI interpretation is temporarily unavailable. Please try again.' })
    } as Response) as unknown as typeof fetch;

    render(<Home />);
    fireEvent.change(screen.getByRole('textbox', { name: 'What’s your story tonight?' }), {
      target: { value: 'I need a story about finding my way after graduation.' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find my film' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/AI interpretation is temporarily unavailable/i);
    expect(screen.queryByRole('heading', { name: 'Your feeling, in film.' })).not.toBeInTheDocument();
  });
});
