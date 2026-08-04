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

export default function Home() {
  const { signOut } = useAuth();
  const { items, loading, addItem, updateItem, deleteItem } = useWatchlist();
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (personFilter !== 'all' && item.addedBy !== personFilter) return false;
    if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
    return true;
  });

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
          <button className="home__signout-btn" onClick={signOut} aria-label="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
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

      <main className="home__grid-wrapper">
        {loading ? (
          <div className="home__empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="home__empty">
            <span className="home__empty-icon">🍿</span>
            <p>Nothing here yet.</p>
            <p>Tap the search icon to add something!</p>
          </div>
        ) : (
          <div className="home__grid">
            {filtered.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
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
