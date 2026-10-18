import { render, screen } from '@testing-library/react';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('announces the current story-discovery step accessibly', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent(
      /reading your story and looking for films that feel close to it/i
    );
    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
  });
});
