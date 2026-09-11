import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import type { CloudLibraryDocument } from '@/cloud/types';
import { createEmptyLibrary } from '@/cloud/libraryState';
import { cloudLibrary, subscribeToLibrary } from '@/services/cloudLibrary';
import { getFirebaseServices, googleProvider, prepareFirebaseAuth } from '@/services/firebase';
import type { RankingDraft, RankingSnapshot } from '@/types/ranking';
import type { SavedShowStatus } from '@/types/savedShow';

type LibraryContextValue = {
  user: User | null;
  state: CloudLibraryDocument | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  online: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
  saveStatus: (tmdbId: number, status: SavedShowStatus, options?: { confirmUnrank?: boolean }) => Promise<CloudLibraryDocument>;
  saveReview: (tmdbId: number, review: string) => Promise<CloudLibraryDocument>;
  deleteShow: (tmdbId: number) => Promise<CloudLibraryDocument>;
  unrankShow: (tmdbId: number) => Promise<CloudLibraryDocument>;
  commitRanking: (draft: RankingDraft) => Promise<RankingSnapshot>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<CloudLibraryDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { auth, ownerUid } = getFirebaseServices();
      void prepareFirebaseAuth().catch((cause) => setError(cause instanceof Error ? cause.message : 'Firebase could not start.'));
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (nextUser && nextUser.uid !== ownerUid) {
          setError('That Google account is not authorized for this personal TVBeli library.');
          void signOut(auth);
          setUser(null);
        } else {
          if (nextUser) setError(null);
          setUser(nextUser);
        }
        setState(null);
        setLoading(false);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Firebase is not configured.');
      setLoading(false);
    }
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    return subscribeToLibrary(user.uid, (next, cached) => {
      setState(next);
      setFromCache(cached);
      setLoading(false);
    }, (cause) => {
      setError(cause.message || 'Your cloud library could not be loaded.');
      setLoading(false);
    });
  }, [retryKey, user]);

  const requireUser = useCallback(() => {
    if (!user) throw new Error('Sign in before changing your library.');
    return user.uid;
  }, [user]);

  const value = useMemo<LibraryContextValue>(() => ({
    user,
    state,
    loading,
    error,
    fromCache,
    online,
    signIn: async () => {
      try {
        setError(null);
        const { auth } = getFirebaseServices();
        await prepareFirebaseAuth();
        await signInWithPopup(auth, googleProvider);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Google sign-in could not be completed.');
        throw cause;
      }
    },
    signOut: async () => signOut(getFirebaseServices().auth),
    retry: () => setRetryKey((key) => key + 1),
    saveStatus: (tmdbId, status, options) => cloudLibrary.saveStatus(requireUser(), tmdbId, status, options),
    saveReview: (tmdbId, review) => cloudLibrary.saveReview(requireUser(), tmdbId, review),
    deleteShow: (tmdbId) => cloudLibrary.deleteShow(requireUser(), tmdbId),
    unrankShow: (tmdbId) => cloudLibrary.unrankShow(requireUser(), tmdbId),
    commitRanking: async (draft) => {
      const next = await cloudLibrary.commitRanking(requireUser(), draft);
      return { revision: next.rankingRevision, groups: next.rankingGroups };
    },
  }), [error, fromCache, loading, online, requireUser, state, user]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used inside LibraryProvider.');
  return value;
}

export function useEmptyLibraryForPreview() {
  return createEmptyLibrary();
}
