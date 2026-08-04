import { getPosterUrl } from '../lib/tmdb';
import './WatchlistCard.css';

const STATUS_LABELS = {
  want_to_watch: 'Want',
  watching: 'Watching',
  watched: 'Watched',
};

export default function WatchlistCard({ item, onClick }) {
  const posterUrl = getPosterUrl(item.posterPath);
  const viewerPosition = Number(item.viewerPosition) === 2 ? 2 : 1;
  const ratingValue = viewerPosition === 1
    ? Number(item.rating1 ?? item.rating ?? 0)
    : Number(item.rating2 ?? item.rating ?? 0);

  return (
    <button className="card" onClick={onClick}>
      <div className="card__poster">
        {posterUrl ? (
          <img src={posterUrl} alt={item.title} className="card__img" />
        ) : (
          <div className="card__no-poster">🎬</div>
        )}
        <span className={`card__type-badge card__type-badge--${item.mediaType}`}>
          {item.mediaType === 'movie' ? 'Movie' : 'TV'}
        </span>
      </div>
      <div className="card__info">
        <p className="card__title">{item.title}</p>
        <p className="card__added-by">Added by: {item.addedBy}</p>
        <span className={`card__status card__status--${item.status}`}>
          {STATUS_LABELS[item.status]}
        </span>
        {ratingValue > 0 && (
          <p className="card__rating">
            {'★'.repeat(ratingValue)}{'☆'.repeat(5 - ratingValue)}
          </p>
        )}
      </div>
    </button>
  );
}
