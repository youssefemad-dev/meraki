import { Fragment, memo } from 'react';

const RecommendationSkeleton: React.FC<{ count?: number }> = memo(({ count = 4 }) => {
  return (
    <Fragment>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-6 last:mb-0">
          <div className="h-48 w-full rounded-lg bg-gray-200 animate-pulse mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            <div className="space-x-2">
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </Fragment>
  );
};

export default RecommendationSkeleton;