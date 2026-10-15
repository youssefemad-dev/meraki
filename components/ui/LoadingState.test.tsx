import { render, screen } from '@testing-library/react';
import LoadingState from './LoadingState';

describe('LoadingState Component', () => {
  it('renders idle state message', () => {
    render(<LoadingState state="idle" />);
    expect(screen.getByText(/ready to discover movies/i)).toBeInTheDocument();
  });

  it('renders interpreting state message', () => {
    render(<LoadingState state="interpreting" />);
    expect(screen.getByText(/understanding your situation/i)).toBeInTheDocument();
  });

  it('renders matching state message', () => {
    render(<LoadingState state="matching" />);
    expect(screen.getByText(/finding movies that match your preferences/i)).toBeInTheDocument();
  });

  it('renders explaining state message', () => {
    render(<LoadingState state="explaining" />);
    expect(screen.getByText(/generating explanations/i)).toBeInTheDocument();
  });

  it('renders success state message', () => {
    render(<LoadingState state="success" />);
    expect(screen.getByText(/here are your personalized recommendations/i)).toBeInTheDocument();
  });

  it('renders error state message', () => {
    render(<LoadingState state="error" errorMessage="Test error" />);
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});