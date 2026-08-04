import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return 0;
}

function sortSessionsDesc(sessions) {
  return [...sessions].sort((a, b) => {
    const aTime = toMillis(a.watchedAt) || toMillis(a.createdAt);
    const bTime = toMillis(b.watchedAt) || toMillis(b.createdAt);
    return bTime - aTime;
  });
}

function subscribeToSessions(setSessions, setLoading, refQuery) {
  const unsub = onSnapshot(refQuery, (snapshot) => {
    setSessions(sortSessionsDesc(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))));
    setLoading(false);
  });

  return unsub;
}

export function useAllWatchSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collectionGroup(db, 'sessions'));
    return subscribeToSessions(setSessions, setLoading, q);
  }, []);

  return { sessions, loading };
}

export function useShowWatchSessions(watchlistId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!watchlistId) {
      setSessions([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const q = query(collection(db, 'watchlist', watchlistId, 'sessions'));
    return subscribeToSessions(setSessions, setLoading, q);
  }, [watchlistId]);

  return { sessions, loading };
}

export async function addShowWatchSession(watchlistId, session) {
  if (!watchlistId) return;

  await addDoc(collection(db, 'watchlist', watchlistId, 'sessions'), {
    ...session,
    createdAt: serverTimestamp(),
  });
}

export async function deleteShowWatchSession(watchlistId, sessionId) {
  if (!watchlistId || !sessionId) return;

  await deleteDoc(doc(db, 'watchlist', watchlistId, 'sessions', sessionId));
}