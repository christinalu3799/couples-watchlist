import { useEffect, useMemo, useState } from 'react';
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

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

  const summary = useMemo(() => {
    const personLabel = personOptions.find((option) => option.value === personFilter)?.label ?? 'Everyone';
    const typeLabel = typeOptions.find((option) => option.value === typeFilter)?.label ?? 'All';
    const statusLabel = STATUS_TABS.find((tab) => tab.value === statusFilter)?.label ?? 'All';

    return [statusLabel, personLabel, typeLabel].join(' · ');
  }, [personFilter, typeFilter, statusFilter, name1, name2]);

  return (
    <div className="filterbar">
      <button
        className="filterbar__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="filterbar-popover"
      >
        <span className="filterbar__trigger-label">Filters</span>
        <span className="filterbar__trigger-summary">{summary}</span>
      </button>
      {open && (
        <div className="filterbar__popover" id="filterbar-popover" role="dialog" aria-label="Filters">
          <div className="filterbar__section">
            <p className="filterbar__section-label">Status</p>
            <div className="filterbar__pill-row">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={`filterbar__pill ${statusFilter === tab.value ? 'filterbar__pill--active' : ''}`}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filterbar__section">
            <p className="filterbar__section-label">Person</p>
            <div className="filterbar__pill-row">
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
          </div>
          <div className="filterbar__section">
            <p className="filterbar__section-label">Type</p>
            <div className="filterbar__pill-row">
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
      )}
    </div>
  );
}
