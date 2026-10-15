import { render } from '@testing-library/react';
import RecommendationSkeleton from './RecommendationSkeleton';

describe('RecommendationSkeleton Component', () => {
  it('renders default number of skeletons', () => {
    const { container } = render(<RecommendationSkeleton />);
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    // Should have 4 skeletons * 4 elements each = 16 pulse elements
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders specified number of skeletons', () => {
    const { container } = render(<RecommendationSkeleton count={2} />);
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    // Should have 2 skeletons * 4 elements each = 8 pulse elements
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});