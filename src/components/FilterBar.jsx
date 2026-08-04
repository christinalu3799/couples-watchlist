import './FilterBar.css';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'want_to_watch', label: 'Want' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

export default function FilterBar({
  statusFilter,
  setStatusFilter,
  personFilter,
  setPersonFilter,
  typeFilter,
  setTypeFilter,
  name1,
  name2,
}) {
  const personOptions = [
    { value: 'all', label: 'Everyone' },
    { value: name1, label: name1 },
    { value: name2, label: name2 },
  ];

  const typeOptions = [
    { value: 'all', label: 'All' },
    { value: 'movie', label: 'Movies' },
    { value: 'tv', label: 'TV' },
  ];

  return (
    <div className="filterbar">
      <div className="filterbar__tabs" role="tablist">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            className={`filterbar__tab ${statusFilter === tab.value ? 'filterbar__tab--active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="filterbar__pills">
        <div className="filterbar__pill-group">
          {personOptions.map((p) => (
            <button
              key={p.value}
              className={`filterbar__pill ${personFilter === p.value ? 'filterbar__pill--active' : ''}`}
              onClick={() => setPersonFilter(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="filterbar__pill-group">
          {typeOptions.map((t) => (
            <button
              key={t.value}
              className={`filterbar__pill ${typeFilter === t.value ? 'filterbar__pill--active' : ''}`}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
