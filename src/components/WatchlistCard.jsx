import { getPosterUrl } from '../lib/tmdb';
import './WatchlistCard.css';

const STATUS_LABELS = {
  want_to_watch: 'Want',
  watching: 'Watching',
  watched: 'Watched',
};

export default function WatchlistCard({ item, onClick }) {
  const posterUrl = getPosterUrl(item.posterPath);

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
        <p className="card__added-by">{item.addedBy}</p>
        <span className={`card__status card__status--${item.status}`}>
          {STATUS_LABELS[item.status]}
        </span>
        {item.rating > 0 && (
          <p className="card__rating">
            {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
          </p>
        )}
        {item.noteLog && item.noteLog.length > 0 && (
          <p className="card__note">
            {item.noteLog[item.noteLog.length - 1].text.length > 60
              ? item.noteLog[item.noteLog.length - 1].text.slice(0, 60) + '…'
              : item.noteLog[item.noteLog.length - 1].text}
          </p>
        )}
      </div>
    </button>
  );
}
