import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deriveOverallStatus } from '../lib/status';

const COLLECTION = 'watchlist';

export function useWatchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('addedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addItem(item) {
    const status1 = item.status1 ?? item.status ?? 'want_to_watch';
    const status2 = item.status2 ?? item.status ?? 'want_to_watch';

    await addDoc(collection(db, COLLECTION), {
      ...item,
      status1,
      status2,
      status: deriveOverallStatus(status1, status2),
      addedAt: serverTimestamp(),
      watchedAt: null,
    });
  }

  async function updateItem(id, updates) {
    const ref = doc(db, COLLECTION, id);

    if (updates.status1 !== undefined || updates.status2 !== undefined) {
      const nextStatus1 = updates.status1 ?? updates.status2;
      const nextStatus2 = updates.status2 ?? updates.status1;
      updates = {
        ...updates,
        status: deriveOverallStatus(nextStatus1, nextStatus2),
      };
    }

    if (updates.status === 'watched') {
      updates = { ...updates, watchedAt: serverTimestamp() };
    }
    await updateDoc(ref, updates);
  }

  async function deleteItem(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  return { items, loading, addItem, updateItem, deleteItem };
}
