import { useState, useEffect } from 'react';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { getPosterUrl, getDetails } from '../lib/tmdb';
import { useAuth } from '../contexts/AuthContext';
import './DetailPanel.css';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

const STATUSES = [
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched ✓' },
];

export default function DetailPanel({ item, onClose, onUpdate, onDelete, name1, name2 }) {
  const { userProfile } = useAuth();
  const [status, setStatus] = useState(item.status);
  const [season, setSeason] = useState(item.currentSeason ?? 1);
  const [episode, setEpisode] = useState(item.currentEpisode ?? 1);
  const [rating1, setRating1] = useState(item.rating1 ?? 0);
  const [rating2, setRating2] = useState(item.rating2 ?? 0);
  const [notes, setNotes] = useState('');
  const [notedBy, setNotedBy] = useState(userProfile?.displayName ?? name1);
  const [watchedBy, setWatchedBy] = useState(userProfile?.displayName ?? name1);
  const [tmdbDetails, setTmdbDetails] = useState(null);

  useEffect(() => {
    getDetails(item.tmdbId, item.mediaType)
      .then(setTmdbDetails)
      .catch(() => {});
  }, [item.tmdbId, item.mediaType]);

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

  function handleRating1Change(value) {
    const next = rating1 === value ? 0 : value;
    setRating1(next);
    onUpdate({ rating1: next });
  }

  function handleRating2Change(value) {
    const next = rating2 === value ? 0 : value;
    setRating2(next);
    onUpdate({ rating2: next });
  }

  function handleLogWatch() {
    const entry = { by: watchedBy, at: new Date().toISOString() };
    onUpdate({ watchLog: arrayUnion(entry) });
  }

  function handleNotesPost() {
    const entry = { text: notes, by: notedBy, at: new Date().toISOString() };
    onUpdate({ noteLog: arrayUnion(entry) });
    setNotes('');
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

        {tmdbDetails && (
          <div className="detail__meta">
            <p className="detail__release-date">
              {item.mediaType === 'movie'
                ? `Released ${new Date(tmdbDetails.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `First aired ${new Date(tmdbDetails.first_air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
              }
              {item.mediaType === 'tv' && tmdbDetails.number_of_seasons &&
                ` · ${tmdbDetails.number_of_seasons} season${tmdbDetails.number_of_seasons > 1 ? 's' : ''}`
              }
            </p>
            {tmdbDetails.overview && (
              <p className="detail__overview">{tmdbDetails.overview}</p>
            )}
            {tmdbDetails.credits?.cast?.length > 0 && (
              <div className="detail__cast">
                <p className="detail__cast-label">Cast</p>
                <div className="detail__cast-chips">
                  {tmdbDetails.credits.cast.slice(0, 8).map((actor) => (
                    <span key={actor.id} className="detail__cast-chip">{actor.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
            <p className="detail__section-label">Ratings</p>
            <div className="detail__rating-row">
              <span className="detail__rating-name">{name1}</span>
              <div className="detail__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`detail__star ${rating1 >= star ? 'detail__star--active' : ''}`}
                    onClick={() => handleRating1Change(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="detail__rating-row">
              <span className="detail__rating-name">{name2}</span>
              <div className="detail__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`detail__star ${rating2 >= star ? 'detail__star--active' : ''}`}
                    onClick={() => handleRating2Change(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="detail__section">
            <p className="detail__section-label">Comments</p>
            {item.noteLog && item.noteLog.length > 0 && (
              <div className="detail__note-log">
                {item.noteLog.map((entry, i) => (
                  <div key={i} className="detail__note-entry">
                    <div>
                      <p className="detail__note-meta">{entry.by} · {formatDate(entry.at)}</p>
                      <p className="detail__note-text">{entry.text}</p>
                    </div>
                    <button
                      className="detail__watch-delete"
                      onClick={() => {
                        if (window.confirm('Delete this comment?')) {
                          onUpdate({ noteLog: arrayRemove(entry) });
                        }
                      }}
                      aria-label="Delete comment"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              className="detail__notes"
              placeholder="Add a comment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <div className="detail__note-footer">
              <div className="detail__rated-by">
                <span className="detail__rated-by-label">Comment by</span>
                {[name1, name2].map((name) => (
                  <button
                    key={name}
                    className={`detail__rated-by-pill ${notedBy === name ? 'detail__rated-by-pill--active' : ''}`}
                    onClick={() => setNotedBy(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button
                className="detail__note-post"
                onClick={handleNotesPost}
                disabled={!notes.trim()}
              >
                Post
              </button>
            </div>
          </section>

          <section className="detail__section">
            <p className="detail__section-label">Watch History</p>
            {item.watchLog && item.watchLog.length > 0 ? (
              <div className="detail__watch-log">
                {[...item.watchLog].reverse().map((entry, i) => (
                  <div key={i} className="detail__watch-entry">
                    <div>
                      <span className="detail__watch-by">{entry.by}</span>
                      <span className="detail__watch-date">{formatDate(entry.at)}</span>
                    </div>
                    <button
                      className="detail__watch-delete"
                      onClick={() => onUpdate({ watchLog: arrayRemove(entry) })}
                      aria-label="Remove"
                    >×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail__watch-empty">No watches logged yet</p>
            )}
            <div className="detail__watch-footer">
              <div className="detail__rated-by">
                {[name1, name2, 'Both 🎬'].map((name) => (
                  <button
                    key={name}
                    className={`detail__rated-by-pill ${watchedBy === name ? 'detail__rated-by-pill--active' : ''}`}
                    onClick={() => setWatchedBy(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button className="detail__note-post" onClick={handleLogWatch}>
                Log watch
              </button>
            </div>
          </section>

          <button
            onClick={() => {
              if (window.confirm(`Remove "${item.title}" from your watchlist?`)) {
                onDelete();
              }
            }}
          >
            Remove from watchlist
          </button>
        </div>
      </div>
    </div>
  );
}
