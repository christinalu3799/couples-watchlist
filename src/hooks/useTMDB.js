import { useState, useEffect, useRef } from 'react';
import { searchTMDB } from '../lib/tmdb';

export function useTMDB() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchTMDB(query);
        setResults(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return { query, setQuery, results, loading, error };
}
