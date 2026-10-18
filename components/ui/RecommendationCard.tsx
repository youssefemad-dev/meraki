import type { RecommendationScore } from '@/lib/recommendations/score';
import { memo } from 'react';

interface RecommendationCardProps {
  recommendation: RecommendationScore;
  rank?: number;
}

const genreNames: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-fi',
  10770: 'TV movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const RecommendationCard: React.FC<RecommendationCardProps> = memo(({ recommendation, rank = 1 }) => {
  const { movie, score, matchReasons } = recommendation;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const genres = movie.genre_ids?.map(id => genreNames[id]).filter(Boolean) ?? [];

  return (
    <article className={`movie-card ${rank === 1 ? 'movie-card--featured' : ''}`}>
      <div className="movie-poster-wrap">
        {movie.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`Poster for ${movie.title}`}
            className="movie-poster"
            loading={rank > 2 ? 'lazy' : 'eager'}
          />
        ) : (
          <div role="img" aria-label={`Poster unavailable for ${movie.title}`} className="poster-unavailable">
            <span>MERAKI<br />FILM NOTES</span><strong>{movie.title}</strong>
          </div>
        )}
        <span className="poster-rank">{String(rank).padStart(2, '0')}</span>
      </div>

      <div className="movie-card-content">
        <div className="movie-card-topline">
          <span className="match-label"><span aria-hidden="true">✳</span> {score >= 85 ? 'A CLOSE STORY MATCH' : 'A STORY MATCH'}</span>
          <span className="match-score" aria-label={`${score} percent story match`}>{Math.round(score)}<small>% match</small></span>
        </div>

        <div className="movie-title-row">
          <h3>{movie.title}</h3>
          {year && <span className="movie-year">{year}</span>}
        </div>

        <p className="movie-overview">{movie.overview || 'A story worth discovering.'}</p>

        <div className="movie-meta" aria-label="Movie details">
          {movie.vote_average > 0 && <span><span className="meta-star" aria-hidden="true">★</span> {movie.vote_average.toFixed(1)} <small>TMDB</small></span>}
          {movie.runtime && <span>{movie.runtime} min</span>}
          {genres.slice(0, 3).map(genre => <span className="genre-pill" key={genre}>{genre}</span>)}
        </div>

        {matchReasons.length > 0 && (
          <div className="match-note">
            <span className="match-note-label">WHY IT MAY RESONATE</span>
            <p>{matchReasons[0]}</p>
          </div>
        )}

        <a className="movie-link" href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">
          Explore this film <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

export default RecommendationCard;
