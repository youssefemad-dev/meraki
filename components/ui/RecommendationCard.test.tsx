import { render, screen } from '@testing-library/react';
import type { RecommendationScore } from '@/lib/recommendations/score';
import RecommendationCard from './RecommendationCard';

const recommendation: RecommendationScore = {
  movie: {
    id: 1,
    title: 'Lady Bird',
    overview: 'A teenager navigates a complicated relationship with her mother.',
    poster_path: '/lady-bird.jpg',
    release_date: '2017-09-01',
    vote_average: 7.4,
    vote_count: 1000,
    runtime: 94,
    genre_ids: [18, 35],
    adult: false,
    popularity: 200
  },
  score: 85.5,
  breakdown: { storyMatch: 0.855, genreMatch: 0, themeMatch: 0, ratingBoost: 0, recencyBoost: 0 },
  matchReasons: [
    'Its mother-daughter relationship captures affection complicated by conflict and independence.'
  ]
};

describe('RecommendationCard', () => {
  it('shows a story match with its explanation and real movie details', () => {
    render(<RecommendationCard recommendation={recommendation} />);

    expect(screen.getByRole('heading', { name: 'Lady Bird' })).toBeInTheDocument();
    expect(screen.getByText(/its mother-daughter relationship captures affection/i)).toBeInTheDocument();
    expect(screen.getByLabelText('85.5 percent story match')).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.getByText('94 min')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Poster for Lady Bird' })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w500/lady-bird.jpg'
    );
  });

  it('shows an accessible poster fallback when TMDB has no poster', () => {
    render(
      <RecommendationCard
        recommendation={{ ...recommendation, movie: { ...recommendation.movie, poster_path: null } }}
      />
    );

    expect(screen.getByRole('img', { name: 'Poster unavailable for Lady Bird' })).toBeInTheDocument();
  });

  it('links to the recommended film on TMDB', () => {
    render(<RecommendationCard recommendation={recommendation} />);

    expect(screen.getByRole('link', { name: /explore this film/i })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/movie/1'
    );
  });
});
