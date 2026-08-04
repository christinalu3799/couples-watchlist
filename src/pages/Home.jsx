import { useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import FilterBar from '../components/FilterBar';
import WatchlistCard from '../components/WatchlistCard';
import SearchModal from '../components/SearchModal';
import DetailPanel from '../components/DetailPanel';
import './Home.css';

const NAME_1 = import.meta.env.VITE_NAME_1;
const NAME_2 = import.meta.env.VITE_NAME_2;

export default function Home() {
  const { items, loading, addItem, updateItem, deleteItem } = useWatchlist();
  const [statusFilter, setStatusFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (personFilter !== 'all' && item.addedBy !== personFilter) return false;
    if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__title">Tristan and Christina's Watchlist ❤️</h1>
        <button
          className="home__search-btn"
          onClick={() => setSearchOpen(true)}
          aria-label="Search to add"
        >a
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
      </header>

      <FilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        personFilter={personFilter}
        setPersonFilter={setPersonFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        name1={NAME_1}
        name2={NAME_2}
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
          name1={NAME_1}
          name2={NAME_2}
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
        />
      )}
    </div>
  );
}
