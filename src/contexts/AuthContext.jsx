import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.log('[Auth] onAuthStateChanged: null user');
        setUser(null);
        setUserProfile(null);
        setIsNewUser(false);
        setLoading(false);
        return;
      }

      const email = (firebaseUser.email ?? '').toLowerCase();
      console.log('[Auth] signed-in email:', JSON.stringify(email));
      console.log('[Auth] allowed emails:', JSON.stringify(ALLOWED_EMAILS));
      if (!ALLOWED_EMAILS.includes(email)) {
        await firebaseSignOut(auth);
        setAuthError("This account doesn't have access. Try a different Google account.");
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setAuthError(null);

      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        setUserProfile(null);
      }
      setLoading(false);
    });
  }, []);

  async function signInWithGoogle() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('Sign-in failed. Please try again.');
      }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setIsNewUser(false);
  }

  async function saveDisplayName(displayName) {
    if (!user) return;
    const email = user.email.toLowerCase();
    const position = ALLOWED_EMAILS.indexOf(email) + 1;
    const profile = { displayName, position, email };
    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
    setIsNewUser(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, isNewUser, authError, signInWithGoogle, signOut, saveDisplayName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
