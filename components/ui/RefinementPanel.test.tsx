import { render, screen, fireEvent } from '@testing-library/react';
import RefinementPanel from './RefinementPanel';
import { InterpretedPreferences } from '@/lib/schemas/preferences';

describe('RefinementPanel Component', () => {
  const mockPreferences: InterpretedPreferences = {
    genrePreferences: ['Action', 'Adventure'],
    mood: 'energetic',
    themes: ['excitement', 'adventure'],
    pace: 'fast',
    contentToAvoid: ['horror'],
    desiredExperience: 'excitement',
    intensity: 'high',
    constraints: {
      excludeAdultContent: true
    }
  };

  const handleRefinement = jest.fn();
  const handleReset = jest.fn();

  it('renders refinement panel when preferences are provided', () => {
    render(<RefinementPanel
      preferences={mockPreferences}
      onRefinement={handleRefinement}
      onReset={handleReset}
      loadingState="idle"
    />);

    expect(screen.getByText(/refine your results/i)).toBeInTheDocument();
    expect(screen.getByText(/what kind of experience?/i)).toBeInTheDocument();
    expect(screen.getByText(/how are you feeling?/i)).toBeInTheDocument();
    expect(screen.getByText(/how intense?/i)).toBeInTheDocument();
    expect(screen.getByText(/what themes interest you?/i)).toBeInTheDocument();
    expect(screen.getByText(/what to avoid?/i)).toBeInTheDocument();
    expect(screen.getByText(/start over/i)).toBeInTheDocument();
  });

  it('does not render when preferences are null', () => {
    render(<RefinementPanel
      preferences={null}
      onRefinement={handleRefinement}
      onReset={handleReset}
      loadingState="idle"
    />);

    expect(screen.queryByText(/refine your results/i)).not.toBeInTheDocument();
  });

  it('calls handleRefinement when experience button is clicked', () => {
    render(<RefinementPanel
      preferences={mockPreferences}
      onRefinement={handleRefinement}
      onReset={handleReset}
      loadingState="idle"
    />);

    const experienceButton = screen.getByRole('button', { name: /what kind of experience?/i });
    expect(experienceButton).toBeEnabled();

    // Simulate click
    fireEvent.click(experienceButton);
    expect(handleRefinement).toHaveBeenCalledWith({
      type: 'SET_DESIRED_EXPERIENCE',
      experience: 'inspiration'
    });
  });

  it('disables buttons when loading', () => {
    render(<RefinementPanel
      preferences={mockPreferences}
      onRefinement={handleRefinement}
      onReset={handleReset}
      loadingState="matching"
    />);

    const experienceButton = screen.getByRole('button', { name: /what kind of experience?/i });
    expect(experienceButton).toBeDisabled();
  });
});