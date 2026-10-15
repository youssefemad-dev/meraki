import { useState } from 'react';
import { InterpretedPreferences, RefinementAction } from '@/lib/schemas/preferences';

interface RefinementPanelProps {
  preferences: InterpretedPreferences | null;
  onRefinement: (action: RefinementAction) => void;
  onReset: () => void;
  loadingState: 'idle' | 'matching' | 'explaining' | 'success' | 'error';
}

export default function RefinementPanel({
  preferences,
  onRefinement,
  onReset,
  loadingState
}: RefinementPanelProps) {
  if (!preferences) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="sr-only">Refine Results</h2>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Refine your results
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <input
                id="refine-experience"
                type="radio"
                name="refine"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
              />
            </div>
            <div className="ml-3 space-y-1">
              <label htmlFor="refine-experience" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Change desired experience
              </label>
              <button
                type="button"
                onClick={() => onRefinement({ type: 'SET_DESIRED_EXPERIENCE', experience: 'inspiration' as const })}
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                What kind of experience?
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <input
                id="refine-mood"
                type="radio"
                name="refine"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
              />
            </div>
            <div className="ml-3 space-y-1">
              <label htmlFor="refine-mood" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Adjust mood
              </label>
              <button
                type="button"
                onClick={() => onRefinement({ type: 'SET_MOOD', mood: 'energetic' as const })}
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                How are you feeling?
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <input
                id="refine-intensity"
                type="radio"
                name="refine"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
              />
            </div>
            <div className="ml-3 space-y-1">
              <label htmlFor="refine-intensity" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Adjust intensity
              </label>
              <button
                type="button"
                onClick={() => onRefinement({ type: 'SET_INTENSITY', intensity: 'high' as const })}
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                How intense?
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <input
                id="refine-add-theme"
                type="radio"
                name="refine"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
              />
            </div>
            <div className="ml-3 space-y-1">
              <label htmlFor="refine-add-theme" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Add a theme
              </label>
              <button
                type="button"
                onClick={() => onRefinement({ type: 'ADD_THEME', theme: 'love' })}
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                What themes interest you?
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <input
                id="refine-avoid"
                type="radio"
                name="refine"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
              />
            </div>
            <div className="ml-3 space-y-1">
              <label htmlFor="refine-avoid" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Avoid certain content
              </label>
              <button
                type="button"
                onClick={() => onRefinement({ type: 'ADD_CONTENT_TO_AVOID', content: 'violence' })}
                disabled={loadingState !== 'idle' && loadingState !== 'error'}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                What to avoid?
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}