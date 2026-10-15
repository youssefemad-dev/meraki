import { useState, useEffect } from 'react';

interface LoadingStateProps {
  state: 'idle' | 'interpreting' | 'matching' | 'explaining' | 'success' | 'error';
  errorMessage?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ state, errorMessage }) => {
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
      <div className="animate-pulse inline-flex items-center w-12 h-12 rounded-full bg-gray-200 mb-4"></div>
      <p className="text-gray-600">{message}</p>
      {state === 'error' && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default LoadingState;