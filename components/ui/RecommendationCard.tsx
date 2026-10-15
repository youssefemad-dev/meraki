import { RecommendationScore } from '@/lib/recommendations/score';
import { memo } from 'react';

interface RecommendationCardProps {
  recommendation: RecommendationScore;
  index: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = memo(({ recommendation, index }) => {
  const { movie, score, matchReasons } = recommendation;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-poster.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
      <div className="relative">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
          <h3 className="text-white text-lg font-semibold line-clamp-2">{movie.title}</h3>
          <p className="text-white text-sm opacity-90 line-clamp-1">
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
          </p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="text-2xl font-bold text-gray-800">{score}</div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-yellow-400">
                {star <= Math.floor(score / 20) ? '★' :
                 star <= Math.ceil(score / 20) && star > Math.floor(score / 20) ? '½★' : '☆'}
              </span>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{movie.overview}</p>
        <div className="space-y-2">
          <div className="flex items-start">
            <span className="flex-shrink-0 text-blue-600">•</span>
            <span className="ml-2 text-sm text-gray-700">
              <strong>Genres:</strong>
              {/* In a real app, we'd map genre IDs to names */}
              {movie.genre_ids?.map((id: number) => {
                const genreMap: Record<number, string> = {
                  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
                  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
                  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
                  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
                  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
                };
                return genreMap[id] || 'Unknown';
              }).join(', ')}
            </span>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 text-blue-600">•</span>
            <span className="ml-2 text-sm text-gray-700">
              <strong>Rating:</strong> {movie.vote_average}/10 ({movie.vote_count} votes)
            </span>
          </div>
          {movie.runtime && (
            <div className="flex items-start">
              <span className="flex-shrink-0 text-blue-600">•</span>
              <span className="ml-2 text-sm text-gray-700">
                <strong>Runtime:</strong> {movie.runtime} min
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="font-medium text-gray-800 mb-2">Why this movie?</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {matchReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

export default RecommendationCard;