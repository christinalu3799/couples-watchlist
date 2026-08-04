import { useState, useEffect, useMemo } from 'react';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { getPosterUrl, getDetails } from '../lib/tmdb';
import { useAuth } from '../contexts/AuthContext';
import {
  addShowWatchSession,
  deleteShowWatchSession,
  useShowWatchSessions,
} from '../hooks/useWatchSessions';
import { deriveOverallStatus } from '../lib/status';
import './DetailPanel.css';

function formatDate(iso, includeTime = true) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    (includeTime ? ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '')
  );
}

function getSeasonEpisodeMap(details) {
  const map = new Map();

  details?.seasons?.forEach((season) => {
    if (typeof season?.season_number === 'number') {
      map.set(season.season_number, Number(season.episode_count) || 0);
    }
  });

  return map;
}

function getNextProgress(season, episode, seasonEpisodeCounts) {
  const currentSeasonCount = seasonEpisodeCounts.get(season) || 0;

  if (currentSeasonCount > 0 && episode < currentSeasonCount) {
    return { season, episode: episode + 1 };
  }

  const nextSeason = season + 1;
  if ((seasonEpisodeCounts.get(nextSeason) || 0) > 0) {
    return { season: nextSeason, episode: 1 };
  }

  return { season, episode: episode + 1 };
}

function formatSessionSpan(session) {
  const startSeason = Number(session.startSeason ?? session.season ?? 1);
  const startEpisode = Number(session.startEpisode ?? session.episodeStart ?? 1);
  const stopSeason = Number(session.stopSeason ?? startSeason);
  const stopEpisode = Number(session.stopEpisode ?? session.episodeEnd ?? startEpisode);

  if (startSeason === stopSeason) {
    const episodeCount = Number(session.episodeCount) || Math.max(1, stopEpisode - startEpisode + 1);
    return `${episodeCount} episode${episodeCount === 1 ? '' : 's'}`;
  }

  const seasonCount = Math.max(1, stopSeason - startSeason);
  return `${seasonCount} season${seasonCount === 1 ? '' : 's'}`;
}

function renderSessionRange(session) {
  const startSeason = Number(session.startSeason ?? session.season ?? 1);
  const startEpisode = Number(session.startEpisode ?? session.episodeStart ?? 1);
  const stopSeason = Number(session.stopSeason ?? startSeason);
  const stopEpisode = Number(session.stopEpisode ?? session.episodeEnd ?? startEpisode);

  return (
    <span className="detail__session-range-text" aria-label={`Season ${startSeason} Episode ${startEpisode} to Season ${stopSeason} Episode ${stopEpisode}`}>
      S{startSeason}E{startEpisode} → S{stopSeason}E{stopEpisode}
    </span>
  );
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return 0;
}

function getLatestLoggedSession(sessions) {
  return [...sessions].sort((a, b) => {
    const aTime = toMillis(a.createdAt) || toMillis(a.watchedAt);
    const bTime = toMillis(b.createdAt) || toMillis(b.watchedAt);
    return bTime - aTime;
  })[0];
}

const STATUSES = [
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched ✓' },
];

const STATUS_LABELS = {
  want_to_watch: 'Want to Watch',
  watching: 'Watching',
  watched: 'Watched',
};

export default function DetailPanel({ item, onClose, onUpdate, onDelete, name1, name2 }) {
  const { userProfile } = useAuth();
  const { sessions: showSessions, loading: showSessionsLoading } = useShowWatchSessions(
    item.mediaType === 'tv' ? item.id : null
  );
  const isTv = item.mediaType === 'tv';
  const historyTabLabel = isTv ? 'Timeline' : 'History';
  const myPosition = userProfile?.position ?? 1;
  const [showRangeFields, setShowRangeFields] = useState(false);
  const [status1, setStatus1] = useState(item.status1 ?? item.status ?? 'want_to_watch');
  const [status2, setStatus2] = useState(item.status2 ?? item.status ?? 'want_to_watch');
  const [rating1, setRating1] = useState(item.rating1 ?? 0);
  const [rating2, setRating2] = useState(item.rating2 ?? 0);
  const [notes, setNotes] = useState('');
  const [watchDate, setWatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startSeason, setStartSeason] = useState('');
  const [startEpisode, setStartEpisode] = useState('');
  const [stopSeason, setStopSeason] = useState('');
  const [stopEpisode, setStopEpisode] = useState('');
  const [watchedTogether, setWatchedTogether] = useState(false);
  const [tmdbDetails, setTmdbDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const myRating = myPosition === 1 ? rating1 : rating2;
  const myName = myPosition === 1 ? name1 : name2;
  const otherRating = myPosition === 1 ? rating2 : rating1;
  const otherName = myPosition === 1 ? name2 : name1;
  const myStatus = myPosition === 1 ? status1 : status2;
  const otherStatus = myPosition === 1 ? status2 : status1;
  const [statusOpen, setStatusOpen] = useState(false);

  const statusSummary =
    myStatus === otherStatus
      ? `Both ${STATUS_LABELS[myStatus] ?? 'Want to Watch'}`
      : `${myName}: ${STATUS_LABELS[myStatus] ?? 'Want to Watch'} · ${otherName}: ${STATUS_LABELS[otherStatus] ?? 'Want to Watch'}`;

  const seasonEpisodeCounts = useMemo(() => getSeasonEpisodeMap(tmdbDetails), [tmdbDetails]);

  const currentProgress = useMemo(() => {
    const latestSession = isTv ? getLatestLoggedSession(showSessions) : null;
    if (!latestSession) {
      return { season: 1, episode: 1 };
    }

    const watchedSeason = Number(latestSession.stopSeason ?? latestSession.endSeason ?? 1);
    const watchedEpisode = Number(latestSession.stopEpisode ?? latestSession.endEpisode ?? 1);

    return getNextProgress(watchedSeason, watchedEpisode, seasonEpisodeCounts);
  }, [isTv, showSessions, seasonEpisodeCounts]);

  useEffect(() => {
    getDetails(item.tmdbId, item.mediaType)
      .then(setTmdbDetails)
      .catch(() => {});
  }, [item.tmdbId, item.mediaType]);

  useEffect(() => {
    setActiveTab('details');
    setWatchedTogether(false);
    setStartSeason('');
    setStartEpisode('');
    setStopSeason('');
    setStopEpisode('');
    setShowRangeFields(false);
  }, [item.id, item.currentSeason, item.currentEpisode]);

  useEffect(() => {
    setStatus1(item.status1 ?? item.status ?? 'want_to_watch');
    setStatus2(item.status2 ?? item.status ?? 'want_to_watch');
  }, [item.status1, item.status2, item.status]);

  function handlePersonStatusChange(personPosition, value) {
    const nextStatus1 = personPosition === 1 ? value : status1;
    const nextStatus2 = personPosition === 2 ? value : status2;

    setStatus1(nextStatus1);
    setStatus2(nextStatus2);

    onUpdate({
      status1: nextStatus1,
      status2: nextStatus2,
      status: deriveOverallStatus(nextStatus1, nextStatus2),
    });
  }

  function fillFromCurrentProgress() {
    setStartSeason(String(currentProgress.season));
    setStartEpisode(String(currentProgress.episode));
    setStopSeason(String(currentProgress.season));
    setStopEpisode(String(currentProgress.episode));
    setShowRangeFields(false);
  }

  function copyStartToStop() {
    if (!startSeason || !startEpisode) return;
    setStopSeason(startSeason);
    setStopEpisode(startEpisode);
  }

  function openRangeFields() {
    setShowRangeFields(true);
    if (!stopSeason && startSeason) {
      setStopSeason(startSeason);
    }
    if (!stopEpisode && startEpisode) {
      setStopEpisode(startEpisode);
    }
  }

  function handleMyRatingChange(value) {
    if (myPosition === 1) {
      const next = rating1 === value ? 0 : value;
      setRating1(next);
      onUpdate({ rating1: next });
    } else {
      const next = rating2 === value ? 0 : value;
      setRating2(next);
      onUpdate({ rating2: next });
    }
  }

  async function handleLogWatch() {
    const watchedAt = watchDate ? new Date(`${watchDate}T12:00:00`) : new Date();
    const watchedBy = userProfile?.displayName ?? myName;
    const parsedStartSeason = Math.max(1, Number(startSeason) || 1);
    const parsedStartEpisode = Math.max(1, Number(startEpisode) || 1);
    const parsedStopSeason = showRangeFields ? Math.max(1, Number(stopSeason) || parsedStartSeason) : parsedStartSeason;
    const parsedStopEpisode = showRangeFields ? Math.max(1, Number(stopEpisode) || parsedStartEpisode) : parsedStartEpisode;
    const rangeLength = parsedStopSeason === parsedStartSeason
      ? Math.max(1, parsedStopEpisode - parsedStartEpisode + 1)
      : 1;
    if (isTv) {
      await addShowWatchSession(item.id, {
        watchlistId: item.id,
        tmdbId: item.tmdbId,
        title: item.title,
        mediaType: item.mediaType,
        watchedAt: watchedAt.toISOString(),
        watchedBy,
        watchedTogether,
        startSeason: parsedStartSeason,
        startEpisode: parsedStartEpisode,
        stopSeason: parsedStopSeason,
        stopEpisode: parsedStopEpisode,
        episodeCount: rangeLength,
      });
    }

    await onUpdate({
      watchLog: arrayUnion({
        by: watchedTogether ? 'Both 🎬' : watchedBy,
        at: watchedAt.toISOString(),
      }),
    });

    setWatchedTogether(false);
    setStartSeason('');
    setStartEpisode('');
    setStopSeason('');
    setStopEpisode('');
    setShowRangeFields(false);
  }

  function handleNotesPost() {
    const entry = { text: notes, by: userProfile?.displayName ?? myName, at: new Date().toISOString() };
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

        {(isTv || item.mediaType === 'movie') && (
          <div className="detail__tabs" role="tablist" aria-label="Detail panel sections">
            <button
              className={`detail__tab ${activeTab === 'details' ? 'detail__tab--active' : ''}`}
              onClick={() => setActiveTab('details')}
              aria-pressed={activeTab === 'details'}
            >
              Details
            </button>
            <button
              className={`detail__tab ${activeTab === 'timeline' ? 'detail__tab--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
              aria-pressed={activeTab === 'timeline'}
            >
              {historyTabLabel}
            </button>
          </div>
        )}

        <div className="detail__body">
          {activeTab === 'details' ? (
            <>
              <section className="detail__section">
                <button
                  className="detail__section-toggle"
                  onClick={() => setStatusOpen((value) => !value)}
                  aria-expanded={statusOpen}
                  type="button"
                >
                  <span className="detail__section-toggle-label">Status</span>
                  <span className="detail__section-toggle-summary">{statusSummary}</span>
                  <span className="detail__section-toggle-icon">{statusOpen ? '▾' : '▸'}</span>
                </button>
                {statusOpen && (
                  <>
                    <div className="detail__status-groups">
                      <div className="detail__status-row">
                        <p className="detail__status-person">{myName}</p>
                        <div className="detail__status-pills">
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              className={`detail__status-pill ${myStatus === s.value ? 'detail__status-pill--active' : ''}`}
                              onClick={() => handlePersonStatusChange(myPosition, s.value)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="detail__status-row">
                        <p className="detail__status-person">{otherName}</p>
                        <div className="detail__status-pills">
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              className={`detail__status-pill ${otherStatus === s.value ? 'detail__status-pill--active' : ''}`}
                              onClick={() => handlePersonStatusChange(myPosition === 1 ? 2 : 1, s.value)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="detail__helper-text">
                      {status1 === 'watching' && status2 === 'watching'
                        ? 'Both people are currently watching.'
                        : 'Each person can set their own status independently.'}
                    </p>
                  </>
                )}
              </section>

              <section className="detail__section">
                <p className="detail__section-label">Ratings</p>
                <div className="detail__rating-row">
                  <span className="detail__rating-name">{myName} <span className="detail__rating-you">(you)</span></span>
                  <div className="detail__stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`detail__star ${myRating >= star ? 'detail__star--active' : ''}`}
                        onClick={() => handleMyRatingChange(star)}
                        aria-label={`${star} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {otherRating > 0 && (
                  <div className="detail__rating-row">
                    <span className="detail__rating-name">{otherName}</span>
                    <div className="detail__stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`detail__star ${otherRating >= star ? 'detail__star--active' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                  <button
                    className="detail__note-post"
                    onClick={handleNotesPost}
                    disabled={!notes.trim()}
                  >
                    Post
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              {isTv ? (
                <section className="detail__section">
                  <p className="detail__section-label">Next Up</p>
                  <div className="detail__current-progress">
                    S{currentProgress.season}E{currentProgress.episode}
                  </div>
                </section>
              ) : (
                <section className="detail__section">
                  <p className="detail__section-label">Watch History</p>
                  {item.watchLog && item.watchLog.length > 0 ? (
                    <div className="detail__watch-log">
                      {[...item.watchLog].reverse().map((entry, i) => (
                        <div key={i} className="detail__watch-entry">
                          <div>
                            <span className="detail__watch-by">{entry.by}</span>
                            <span className="detail__watch-date"> watched on {formatDate(entry.at, false)}</span>
                          </div>
                          <button
                            className="detail__watch-delete"
                            onClick={() => onUpdate({ watchLog: arrayRemove(entry) })}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="detail__watch-empty">No watches logged yet</p>
                  )}
                  <div className="detail__watch-footer">
                    <div className="detail__watch-controls">
                      <label className="detail__watch-field">
                        <span className="detail__watch-field-label">Watch date</span>
                        <input
                          className="detail__watch-date-input"
                          type="date"
                          value={watchDate}
                          onChange={(e) => setWatchDate(e.target.value)}
                          aria-label="Watch date"
                        />
                      </label>
                      <label className="detail__watch-checkbox detail__watch-checkbox--block">
                        <input
                          type="checkbox"
                          checked={watchedTogether}
                          onChange={(e) => setWatchedTogether(e.target.checked)}
                        />
                        <span>Watched together</span>
                      </label>
                    </div>
                    <button className="detail__note-post" onClick={handleLogWatch}>
                      Log watch
                    </button>
                  </div>
                </section>
              )}

              {isTv && (
                <section className="detail__section">
                  <p className="detail__section-label">Log Session</p>
                  <p className="detail__helper-text">Tap current progress for a one-episode log, or expand the range for multiple episodes.</p>
                  <div className="detail__quick-actions">
                    <button className="detail__quick-action" onClick={fillFromCurrentProgress}>
                      Use current progress
                    </button>
                    <button className="detail__quick-action" onClick={openRangeFields}>
                      Log multiple episodes
                    </button>
                  </div>
                  <div className="detail__session-form">
                    <label className="detail__watch-field detail__watch-field--session-start">
                      <span className="detail__watch-field-label">Start season</span>
                      <input
                        className="detail__watch-count-input"
                        type="number"
                        min="1"
                        step="1"
                        value={startSeason}
                        onChange={(e) => setStartSeason(e.target.value)}
                        aria-label="Start season"
                      />
                    </label>
                    <label className="detail__watch-field detail__watch-field--session-start">
                      <span className="detail__watch-field-label">Start episode</span>
                      <input
                        className="detail__watch-count-input"
                        type="number"
                        min="1"
                        step="1"
                        value={startEpisode}
                        onChange={(e) => setStartEpisode(e.target.value)}
                        aria-label="Start episode"
                      />
                    </label>
                    {showRangeFields && (
                      <>
                        <label className="detail__watch-field">
                          <span className="detail__watch-field-label">Stop season</span>
                          <input
                            className="detail__watch-count-input"
                            type="number"
                            min="1"
                            step="1"
                            value={stopSeason}
                            onChange={(e) => setStopSeason(e.target.value)}
                            aria-label="Stop season"
                          />
                        </label>
                        <label className="detail__watch-field">
                          <span className="detail__watch-field-label">Stop episode</span>
                          <input
                            className="detail__watch-count-input"
                            type="number"
                            min="1"
                            step="1"
                            value={stopEpisode}
                            onChange={(e) => setStopEpisode(e.target.value)}
                            aria-label="Stop episode"
                          />
                        </label>
                      </>
                    )}
                    <div className="detail__watch-inline-row">
                      <label className="detail__watch-field detail__watch-field--date">
                        <span className="detail__watch-field-label">Watch date</span>
                        <input
                          className="detail__watch-date-input"
                          type="date"
                          value={watchDate}
                          onChange={(e) => setWatchDate(e.target.value)}
                          aria-label="Watch date"
                        />
                      </label>
                      <label className="detail__watch-checkbox detail__watch-checkbox--inline">
                        <input
                          type="checkbox"
                          checked={watchedTogether}
                          onChange={(e) => setWatchedTogether(e.target.checked)}
                        />
                        <span>Watched together</span>
                      </label>
                    </div>
                  </div>
                  <div className="detail__note-footer">
                    <button className="detail__note-post" onClick={handleLogWatch}>
                      Log watch
                    </button>
                  </div>
                </section>
              )}

              {isTv && (
                <section className="detail__section">
                  <p className="detail__section-label">TV Timeline</p>
                  {showSessionsLoading ? (
                    <p className="detail__watch-empty">Loading timeline…</p>
                  ) : showSessions.length === 0 ? (
                    <p className="detail__watch-empty">No TV sessions logged yet</p>
                  ) : (
                    <div className="detail__session-log">
                      {showSessions.map((session) => {
                        return (
                          <div key={session.id} className="detail__session-entry">
                            <div>
                              <p className="detail__session-meta">
                                {formatDate(session.watchedAt, false)} · {formatSessionSpan(session)}
                              </p>
                              <div className="detail__session-range-row">{renderSessionRange(session)}</div>
                              <p className="detail__session-text">
                                {session.watchedTogether ? 'Watched together' : session.watchedBy}
                              </p>
                            </div>
                            <button
                              className="detail__watch-delete"
                              onClick={async () => {
                                if (window.confirm('Delete this watch session?')) {
                                  await deleteShowWatchSession(session.watchlistId, session.id);
                                }
                              }}
                              aria-label="Delete watch session"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          <button
            className="detail__delete"
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
