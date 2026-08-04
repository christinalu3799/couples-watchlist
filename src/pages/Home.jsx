import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import FilterBar from '../components/FilterBar';
import WatchlistCard from '../components/WatchlistCard';
import SearchModal from '../components/SearchModal';
import DetailPanel from '../components/DetailPanel';
import './Home.css';

const FALLBACK_1 = import.meta.env.VITE_NAME_1;
const FALLBACK_2 = import.meta.env.VITE_NAME_2;

export default function Home({ onOpenTimeline }) {
  const { signOut } = useAuth();
  const { items, loading, addItem, updateItem, deleteItem } = useWatchlist();
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('recent');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('position'));
    return onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map((d) => d.data()));
    });
  }, []);

  const name1 = allUsers.find((u) => u.position === 1)?.displayName ?? FALLBACK_1;
  const name2 = allUsers.find((u) => u.position === 2)?.displayName ?? FALLBACK_2;

  // Keep selectedItem in sync with live Firestore data
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find((i) => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [items]);

  const filtered = items
    .filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (personFilter !== 'all' && item.addedBy !== personFilter) return false;
      if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
      return true;
    })
    .sort((a, b) =>
      sortOrder === 'alpha' ? a.title.localeCompare(b.title) : 0
    );

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__title">T & C's Watchlist ❤️</h1>
        <div className="home__header-actions">
          <button
            className="home__search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search to add"
          >
            <svg
              width="22"
              height="22"
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
          </button>
          <div className="home__menu-wrap">
            <button
              className="home__menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="home-menu"
            >
              <span />
              <span />
              <span />
            </button>
            {menuOpen && (
              <div className="home__menu" id="home-menu" role="menu" aria-label="Main menu">
                <button
                  className="home__menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenTimeline();
                  }}
                  role="menuitem"
                >
                  View timeline
                </button>
                <button
                  className="home__menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsDark((value) => !value);
                  }}
                  role="menuitem"
                >
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  className="home__menu-item home__menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <FilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        personFilter={personFilter}
        setPersonFilter={setPersonFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        name1={name1}
        name2={name2}
      />

      <div className="home__toolbar">
        <div className="home__toolbar-group">
          <button
            className={`home__toolbar-btn ${sortOrder === 'recent' ? 'home__toolbar-btn--active' : ''}`}
            onClick={() => setSortOrder('recent')}
          >Recent</button>
          <button
            className={`home__toolbar-btn ${sortOrder === 'alpha' ? 'home__toolbar-btn--active' : ''}`}
            onClick={() => setSortOrder('alpha')}
          >A–Z</button>
        </div>
        <div className="home__toolbar-group">
          <button
            className={`home__toolbar-btn ${viewMode === 'grid' ? 'home__toolbar-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
          </button>
          <button
            className={`home__toolbar-btn ${viewMode === 'list' ? 'home__toolbar-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="4" width="18" height="2.5" rx="1"/>
              <rect x="3" y="10.75" width="18" height="2.5" rx="1"/>
              <rect x="3" y="17.5" width="18" height="2.5" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      <main className="home__grid-wrapper">
        {loading ? (
          <div className="home__empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="home__empty">
            <span className="home__empty-icon">🍿</span>
            <p>Nothing here yet.</p>
            <p>Tap the search icon to add something!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="home__grid">
            {filtered.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="home__list">
            {filtered.map((item) => (
              <button
                key={item.id}
                className="home__list-row"
                onClick={() => setSelectedItem(item)}
              >
                <div className="home__list-poster">
                  {item.posterPath
                    ? <img src={`https://image.tmdb.org/t/p/w92${item.posterPath}`} alt={item.title} />
                    : <span>🎬</span>}
                </div>
                <div className="home__list-info">
                  <p className="home__list-title">{item.title}</p>
                  <p className="home__list-meta">
                    {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                    {' · Added by: '}{item.addedBy}
                  </p>
                </div>
                <span className={`home__list-status home__list-status--${item.status}`}>
                  {item.status === 'want_to_watch' ? 'Want' : item.status === 'watching' ? 'Watching' : '✓'}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onAdd={addItem}
          name1={name1}
          name2={name2}
          existingIds={items.map((i) => i.tmdbId)}
        />
      )}

      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={(updates) => updateItem(selectedItem.id, updates)}
          onDelete={() => {
            deleteItem(selectedItem.id);
            setSelectedItem(null);
          }}
          name1={name1}
          name2={name2}
        />
      )}
    </div>
  );
}
