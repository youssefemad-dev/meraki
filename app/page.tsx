import { useState, useCallback } from 'react';
import LoadingState from '@/components/ui/LoadingState';
import RecommendationCard from '@/components/ui/RecommendationCard';
import RefinementPanel from '@/components/ui/RefinementPanel';
import { InterpretedPreferences, RefinementAction } from '@/lib/schemas/preferences';
import { RecommendationScore } from '@/lib/recommendations/score';

export default function Home() {
  const preferencesToSituation = (prefs: InterpretedPreferences): string => {
    const parts = [];

    if (prefs.genrePreferences?.length) {
      parts.push(`I want to watch ${prefs.genrePreferences.join(' or ')} movies`);
    }

    if (prefs.mood) {
      parts.push(`I'm feeling ${prefs.mood}`);
    }

    if (prefs.desiredExperience) {
      parts.push(`I'm looking for ${prefs.desiredExperience}`);
    }

    if (prefs.intensity) {
      parts.push(`with ${prefs.intensity} intensity`);
    }

    if (prefs.themes?.length) {
      parts.push(`featuring themes like ${prefs.themes.slice(0, 3).join(', ')}`);
    }

    if (prefs.contentToAvoid?.length) {
      parts.push(`but I want to avoid ${prefs.contentToAvoid.join(' and ')}`);
    }

    if (parts.length === 0) {
      return 'I want to watch a good movie';
    }

    return parts.join(' ');
  };
  const [situation, setSituation] = useState('');
  const [interpretedPreferences, setInterpretedPreferences] = useState<InterpretedPreferences | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loadingState, setLoadingState] = useState<'idle' | 'interpreting' | 'matching' | 'explaining' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) return;

    setLoadingState('interpreting');
    setErrorMessage(null);

    try {
      // Call the discovery API
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ situation }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setLoadingState('error');
        setErrorMessage(data.error);
        return;
      }

      setInterpretedPreferences(data.preferences);
      setRecommendations(data.recommendations);
      setLoadingState('success');
    } catch (error) {
      console.error('Discovery failed:', error);
      setLoadingState('error');
      setErrorMessage('Failed to get recommendations. Please try again.');
    }
  }, [situation]);

  const handleRefinement = useCallback(async (action: RefinementAction) => {
    if (!interpretedPreferences) return;

    setLoadingState('matching');
    setErrorMessage(null);

    try {
      // Call the refinement API
      const response = await fetch('/api/refinement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: interpretedPreferences, action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setLoadingState('error');
        setErrorMessage(data.error);
        return;
      }

      // Update preferences with the refined ones
      setInterpretedPreferences(data.preferences);

      // Get new recommendations based on refined preferences
      setLoadingState('explaining');

      // Convert refined preferences back to a situation-like string for the discover API
      const situationFromPreferences = preferencesToSituation(data.preferences);

      // Call discover API with the situation derived from refined preferences
      const discoverResponse = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ situation: situationFromPreferences }),
      });

      if (!discoverResponse.ok) {
        throw new Error(`HTTP error! status: ${discoverResponse.status}`);
      }

      const discoverData = await discoverResponse.json();

      if (discoverData.error) {
        setLoadingState('error');
        setErrorMessage(discoverData.error);
        return;
      }

      setRecommendations(discoverData.recommendations);
      setLoadingState('success');
    } catch (error) {
      console.error('Refinement failed:', error);
      setLoadingState('error');
      setErrorMessage('Failed to refine recommendations. Please try again.');
    }
  }, [interpretedPreferences]);


  const handleReset = useCallback(() => {
    setSituation('');
    setInterpretedPreferences(null);
    setRecommendations([]);
    setLoadingState('idle');
    setErrorMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <header className="bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-8 w-auto" src="/meraki-logo.svg" alt="Meraki" />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Browse
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Lists
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    About
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8 px-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Describe your movie night situation
                </div>
                <div className="relative">
                  <textarea
                    id="situation"
                    rows={4}
                    className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="e.g., 'I want to watch something romantic but not too cheesy with my partner after a long week'"
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    disabled={loadingState !== 'idle' && loadingState !== 'error'}
                  />
                  {loadingState !== 'idle' && loadingState !== 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <LoadingState state={loadingState} />
                    </div>
                  )}
                </div>
                {errorMessage && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loadingState !== 'idle' && loadingState !== 'error' || !situation.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Discover Movies
                </button>
                {loadingState === 'error' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </form>

            {/* Results Section */}
            {interpretedPreferences && recommendations.length > 0 && (
              <>
                <div className="mt-8">
                  <h2 className="sr-only">Your Preferences</h2>
                  <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Based on your situation:
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      You're looking for a "{interpretedPreferences.desiredExperience}" experience
                      with a {interpretedPreferences.mood} mood.
                    </p>
                    {interpretedPreferences.themes?.length && (
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Themes: {interpretedPreferences.themes.join(', ')}
                      </p>
                    )}
                    {interpretedPreferences.contentToAvoid?.length && (
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Avoiding: {interpretedPreferences.contentToAvoid.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="sr-only">Recommendations</h2>
                  {loadingState === 'success' && recommendations.length > 0 ? (
                    <div className="space-y-6">
                      {recommendations.map((rec, index) => (
                        <RecommendationCard
                          key={rec.movie.id}
                          recommendation={rec}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : loadingState === 'matching' || loadingState === 'explaining' ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <LoadingState state={loadingState} />
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {/* Refinement Section */}
            {interpretedPreferences && recommendations.length > 0 && loadingState === 'success' && (
              <RefinementPanel
                preferences={interpretedPreferences}
                onRefinement={handleRefinement}
                onReset={handleReset}
                loadingState={loadingState}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="space-y-6">
              {/* How it works */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  How Meraki Works
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-zinc-600 dark:text-zinc-400">
                  <li>Describe your movie night situation in natural language</li>
                  <li>Our AI understands your preferences and context</li>
                  <li>We find movies that match your desired experience</li>
                  <li>Get personalized recommendations with explanations</li>
                  <li>Refine results until you find the perfect movie</li>
                </ol>
              </div>

              {/* Example situations */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Try These Examples
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSituation('Romantic date night at home with my partner')}
                    className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus-ring-offset-2 focus-ring-indigo-500"
                  >
                    Romantic date night at home
                  </button>
                  <button
                    type="button"
                    onClick={() => setSituation('Exciting action movie to watch with friends on Friday')}
                    className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus-ring-offset-2 focus-ring-indigo-500"
                  >
                    Action movie with friends
                  </button>
                  <button
                    type="button"
                    onClick={() => setSituation('Thoughtful drama to watch alone on a rainy Sunday')}
                    className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus-ring-offset-2 focus-ring-indigo-500"
                  >
                    Thoughtful solo drama
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-white dark:bg-zinc-900 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © 2026 Meraki. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}