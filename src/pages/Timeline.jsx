import { useMemo } from 'react';
import { useAllWatchSessions } from '../hooks/useWatchSessions';
import './Timeline.css';

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatSessionRange(session) {
  const startSeason = Number(session.startSeason ?? session.season ?? 1);
  const startEpisode = Number(session.startEpisode ?? session.episodeStart ?? 1);
  const stopSeason = Number(session.stopSeason ?? startSeason);
  const stopEpisode = Number(session.stopEpisode ?? session.episodeEnd ?? startEpisode);

  return `S${startSeason}E${startEpisode} → S${stopSeason}E${stopEpisode}`;
}

function formatSessionSummary(session) {
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

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function Timeline({ onBackHome }) {
  const { sessions, loading } = useAllWatchSessions();

  const tvSessions = useMemo(
    () => sessions.filter((session) => session.mediaType === 'tv'),
    [sessions]
  );

  const groupedDays = useMemo(() => {
    const map = new Map();

    tvSessions.forEach((session) => {
      const watchedDate = toDate(session.watchedAt) ?? toDate(session.createdAt) ?? new Date();
      const key = dayKey(watchedDate);
      const items = map.get(key) ?? [];
      items.push({ ...session, watchedDate });
      map.set(key, items);
    });

    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        label: formatDayLabel(items[0].watchedDate),
        items: items.sort((a, b) => b.watchedDate - a.watchedDate),
      }));
  }, [tvSessions]);

  const stats = useMemo(() => {
    const totalEpisodes = tvSessions.reduce((sum, session) => sum + (Number(session.episodeCount) || 1), 0);
    const togetherSessions = tvSessions.filter((session) => session.watchedTogether).length;

    return {
      sessions: tvSessions.length,
      totalEpisodes,
      activeDays: groupedDays.length,
      togetherSessions,
    };
  }, [tvSessions, groupedDays]);

  return (
    <div className="timeline">
      <header className="timeline__header">
        <button className="timeline__back" onClick={onBackHome} aria-label="Back to watchlist">
          ← Watchlist
        </button>
        <div>
          <p className="timeline__eyebrow">TV only</p>
          <h1 className="timeline__title">Watch Timeline</h1>
        </div>
      </header>

      <section className="timeline__stats">
        <div className="timeline__stat">
          <span className="timeline__stat-value">{stats.sessions}</span>
          <span className="timeline__stat-label">sessions</span>
        </div>
        <div className="timeline__stat">
          <span className="timeline__stat-value">{stats.totalEpisodes}</span>
          <span className="timeline__stat-label">spans logged</span>
        </div>
        <div className="timeline__stat">
          <span className="timeline__stat-value">{stats.activeDays}</span>
          <span className="timeline__stat-label">days active</span>
        </div>
        <div className="timeline__stat">
          <span className="timeline__stat-value">{stats.togetherSessions}</span>
          <span className="timeline__stat-label">together</span>
        </div>
      </section>

      <main className="timeline__body">
        {loading ? (
          <div className="timeline__empty">Loading timeline…</div>
        ) : groupedDays.length === 0 ? (
          <div className="timeline__empty">
            <p>No TV watch sessions yet.</p>
            <p>Log a watch from a TV show detail panel to start the timeline.</p>
          </div>
        ) : (
          groupedDays.map((day) => (
            <section key={day.key} className="timeline__day">
              <div className="timeline__day-head">
                <h2>{day.label}</h2>
                <span>{day.items.length} session{day.items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="timeline__list">
                {day.items.map((session) => (
                  <article key={session.id} className="timeline__entry">
                    <div className="timeline__entry-main">
                      <div className="timeline__entry-top">
                        <h3>{session.title}</h3>
                        <span className="timeline__entry-count">TV</span>
                      </div>
                      <p className="timeline__entry-meta">{formatSessionRange(session)}</p>
                      <p className="timeline__entry-meta">{formatSessionSummary(session)}</p>
                      <p className="timeline__entry-meta">
                        {session.watchedTogether ? 'Watched together' : session.watchedBy}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}