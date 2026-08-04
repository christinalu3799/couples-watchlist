const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
  'Content-Type': 'application/json',
};

export async function searchTMDB(query) {
  if (!query.trim()) return [];

  const res = await fetch(
    `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    { headers }
  );

  if (!res.ok) throw new Error('TMDB search failed');
  const data = await res.json();
  return data.results.filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv'
  );
}

export function getPosterUrl(path) {
  if (!path) return null;
  return `${IMAGE_BASE}${path}`;
}
