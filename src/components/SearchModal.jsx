import { useState, useEffect, useRef } from 'react';
import { useTMDB } from '../hooks/useTMDB';
import { getPosterUrl } from '../lib/tmdb';
import { useAuth } from '../contexts/AuthContext';
import './SearchModal.css';

export default function SearchModal({ onClose, onAdd, name1, name2, existingIds }) {
  const { userProfile } = useAuth();
  const { query, setQuery, results, loading } = useTMDB();
  const [addedBy, setAddedBy] = useState(userProfile?.displayName ?? name1);
  const [addingId, setAddingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleAdd(result) {
    setAddingId(result.id);
    await onAdd({
      tmdbId: result.id,
      mediaType: result.media_type,
      title: result.title || result.name,
      posterPath: result.poster_path ?? null,
      addedBy,
      status: 'want_to_watch',
      status1: 'want_to_watch',
      status2: 'want_to_watch',
      currentSeason: result.media_type === 'tv' ? 1 : null,
      currentEpisode: result.media_type === 'tv' ? 1 : null,
      rating: 0,
      notes: '',
    });
    setAddingId(null);
  }

  return (
    <div className="search-modal" onClick={handleBackdrop}>
      <div className="search-modal__sheet">
        <div className="search-modal__handle" />
        <div className="search-modal__header">
          <div className="search-modal__input-wrap">
            <svg
              className="search-modal__icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              className="search-modal__input"
              type="search"
              placeholder="Search movies &amp; shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="search-modal__results">
          {loading && <p className="search-modal__hint">Searching...</p>}
          {!loading && query && results.length === 0 && (
            <p className="search-modal__hint">No results for &ldquo;{query}&rdquo;</p>
          )}
          {!loading && !query && (
            <p className="search-modal__hint">Type to search movies and shows</p>
          )}
          {results.map((result) => {
            const alreadyAdded = existingIds.includes(result.id);
            const title = result.title || result.name;
            const year = (result.release_date || result.first_air_date || '').slice(0, 4);
            const posterUrl = getPosterUrl(result.poster_path);

            return (
              <div key={result.id} className="search-modal__result">
                <div className="search-modal__result-poster">
                  {posterUrl ? (
                    <img src={posterUrl} alt={title} />
                  ) : (
                    <span>🎬</span>
                  )}
                </div>
                <div className="search-modal__result-info">
                  <p className="search-modal__result-title">{title}</p>
                  <p className="search-modal__result-meta">
                    {result.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    {year && ` · ${year}`}
                  </p>
                </div>
                <button
                  className={`search-modal__add-btn ${alreadyAdded ? 'search-modal__add-btn--added' : ''}`}
                  onClick={() => !alreadyAdded && handleAdd(result)}
                  disabled={alreadyAdded || addingId === result.id}
                >
                  {alreadyAdded ? '✓' : addingId === result.id ? '…' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
