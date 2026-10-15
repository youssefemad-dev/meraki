import { useState, useEffect, memo } from 'react';

interface LoadingStateProps {
  state: 'idle' | 'interpreting' | 'matching' | 'explaining' | 'success' | 'error';
  errorMessage?: string;
}

const LoadingState: React.FC<LoadingStateProps> = memo(({ state, errorMessage }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    switch (state) {
      case 'idle':
        setMessage('Ready to discover movies');
        break;
      case 'interpreting':
        setMessage('Understanding your situation...');
        break;
      case 'matching':
        setMessage('Finding movies that match your preferences...');
        break;
      case 'explaining':
        setMessage('Generating explanations...');
        break;
      case 'success':
        setMessage('Here are your personalized recommendations!');
        break;
      case 'error':
        setMessage(errorMessage || 'Something went wrong. Please try again.');
        break;
    }
  }, [state, errorMessage]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-14 h-14 mb-4">
        {/* Custom spinner with aria-label for accessibility */}
        <div
          role="img"
          aria-label="Loading"
          className="h-5 w-5 border-t-2 border-b-2 border-l-2 border-indigo-600 rounded-full animate-spin"
        ></div>
      </div>
      {/* Live region for announcing loading state changes */}
      <p
        aria-live="polite"
        className="text-gray-600"
      >
        {message}
      </p>
      {state === 'error' && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus-ring-offset-2 focus-ring-indigo-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default LoadingState;