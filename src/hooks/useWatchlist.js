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
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    await addDoc(collection(db, COLLECTION), {
      ...item,
      addedAt: serverTimestamp(),
      watchedAt: null,
    });
  }

  async function updateItem(id, updates) {
    const ref = doc(db, COLLECTION, id);
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
