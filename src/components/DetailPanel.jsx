import { useState, useRef } from 'react';
import { getPosterUrl } from '../lib/tmdb';
import './DetailPanel.css';

const STATUSES = [
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched ✓' },
];

export default function DetailPanel({ item, onClose, onUpdate, onDelete }) {
  const [status, setStatus] = useState(item.status);
  const [season, setSeason] = useState(item.currentSeason ?? 1);
  const [episode, setEpisode] = useState(item.currentEpisode ?? 1);
  const [rating, setRating] = useState(item.rating ?? 0);
  const [notes, setNotes] = useState(item.notes ?? '');
  const notesTimerRef = useRef(null);

  function handleStatusChange(value) {
    setStatus(value);
    onUpdate({ status: value });
  }

  function handleSeasonChange(value) {
    const next = Math.max(1, value);
    setSeason(next);
    onUpdate({ currentSeason: next });
  }

  function handleEpisodeChange(value) {
    const next = Math.max(1, value);
    setEpisode(next);
    onUpdate({ currentEpisode: next });
  }

  function handleRatingChange(value) {
    const next = rating === value ? 0 : value;
    setRating(next);
    onUpdate({ rating: next });
  }

  function handleNotesChange(e) {
    const value = e.target.value;
    setNotes(value);
    clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      onUpdate({ notes: value });
    }, 600);
  }

  const posterUrl = getPosterUrl(item.posterPath);

  return (
    <div
      className="detail"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail__panel">
        <button className="detail__close" onClick={onClose} aria-label="Close">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="detail__hero">
          {posterUrl ? (
            <img src={posterUrl} alt={item.title} className="detail__poster" />
          ) : (
            <div className="detail__no-poster">🎬</div>
          )}
          <div className="detail__hero-overlay">
            <span className={`detail__type-badge detail__type-badge--${item.mediaType}`}>
              {item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
            </span>
            <h2 className="detail__title">{item.title}</h2>
            <p className="detail__added-by">Added by {item.addedBy}</p>
          </div>
        </div>

        <div className="detail__body">
          <section className="detail__section">
            <p className="detail__section-label">Status</p>
            <div className="detail__status-pills">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  className={`detail__status-pill ${status === s.value ? 'detail__status-pill--active' : ''}`}
                  onClick={() => handleStatusChange(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {item.mediaType === 'tv' && (
            <section className="detail__section">
              <p className="detail__section-label">Progress</p>
              <div className="detail__steppers">
                <div className="detail__stepper">
                  <span className="detail__stepper-label">Season</span>
                  <div className="detail__stepper-controls">
                    <button onClick={() => handleSeasonChange(season - 1)}>−</button>
                    <span>{season}</span>
                    <button onClick={() => handleSeasonChange(season + 1)}>+</button>
                  </div>
                </div>
                <div className="detail__stepper">
                  <span className="detail__stepper-label">Episode</span>
                  <div className="detail__stepper-controls">
                    <button onClick={() => handleEpisodeChange(episode - 1)}>−</button>
                    <span>{episode}</span>
                    <button onClick={() => handleEpisodeChange(episode + 1)}>+</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="detail__section">
            <p className="detail__section-label">Rating</p>
            <div className="detail__stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`detail__star ${rating >= star ? 'detail__star--active' : ''}`}
                  onClick={() => handleRatingChange(star)}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </section>

          <section className="detail__section">
            <p className="detail__section-label">Notes</p>
            <textarea
              className="detail__notes"
              placeholder="Add a note..."
              value={notes}
              onChange={handleNotesChange}
              rows={3}
            />
          </section>

          <button className="detail__delete" onClick={onDelete}>
            Remove from watchlist
          </button>
        </div>
      </div>
    </div>
  );
}
