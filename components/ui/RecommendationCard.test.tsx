import { render, screen } from '@testing-library/react';
import RecommendationCard from './RecommendationCard';

describe('RecommendationCard Component', () => {
  const mockRecommendation = {
    movie: {
      id: 1,
      title: 'Test Movie',
      overview: 'This is a test movie overview',
      poster_path: '/test.jpg',
      release_date: '2023-05-15',
      vote_average: 8.5,
      vote_count: 1000,
      runtime: 120,
      genre_ids: [28, 12], // Action, Adventure
      adult: false,
      popularity: 200
    },
    score: 85.5,
    breakdown: {
      genreMatch: 0.8,
      themeMatch: 0.7,
      ratingBoost: 0.9,
      recencyBoost: 0.6
    },
    matchReasons: [
      'Strong genre match with Action, Adventure',
      'Themes of excitement, adventure align with your preferences',
      'Highly rated by audiences (8.5/10 from 1000 votes)',
      'Recent release (2023) that fits your taste for contemporary films'
    ]
  };

  it('renders movie title', () => {
    render(<RecommendationCard recommendation={mockRecommendation} index={0} />);
    expect(screen.getByRole('heading', { name: /test movie/i, level: 3 })).toBeInTheDocument();
  });

  it('renders movie score', () => {
    render(<RecommendationCard recommendation={mockRecommendation} index={0} />);
    expect(screen.getByText(/85.5/)).toBeInTheDocument();
  });

  it('renders match reasons', () => {
    render(<RecommendationCard recommendation={mockRecommendation} index={0} />);
    expect(screen.getByText(/strong genre match/i)).toBeInTheDocument();
    expect(screen.getByText(/themes of excitement, adventure/i)).toBeInTheDocument();
  });

  it('renders movie runtime', () => {
    render(<RecommendationCard recommendation={mockRecommendation} index={0} />);
    expect(screen.getByText(/120 min/)).toBeInTheDocument();
  });

  it('renders movie rating and vote count', () => {
    render(<RecommendationCard recommendation={mockRecommendation} index={0} />);
    // Find the rating container and check it contains both the label and value
    const ratingContainer = screen.getAllByText(/rating:/i)[0].closest('.flex.items-start');
    expect(ratingContainer).toHaveTextContent(/8.5\/10 \(1000 votes\)/);
  });
});