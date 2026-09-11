import { doc, onSnapshot, runTransaction, type Unsubscribe } from 'firebase/firestore';

import { OfflineWriteError } from '@/cloud/errors';
import {
  applyDeleteMutation,
  applyRankingMutation,
  applyReviewMutation,
  applyStatusMutation,
  applyUnrankMutation,
  createEmptyLibrary,
  normalizeLibrary,
} from '@/cloud/libraryState';
import type { CloudLibraryDocument } from '@/cloud/types';
import { getFirebaseServices } from '@/services/firebase';
import type { RankingDraft } from '@/types/ranking';
import type { SavedShowStatus } from '@/types/savedShow';

const MAX_DOCUMENT_BYTES = 850_000;

function ensureOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new OfflineWriteError();
}

function libraryRef(uid: string) {
  const { firestore, ownerUid } = getFirebaseServices();
  if (uid !== ownerUid) throw new Error('This Google account is not authorized to use this TVBeli library.');
  return doc(firestore, 'tvbeliLibraries', ownerUid);
}

function validateSize(state: CloudLibraryDocument) {
  const bytes = new TextEncoder().encode(JSON.stringify(state)).byteLength;
  if (bytes > MAX_DOCUMENT_BYTES) throw new Error('Your library is approaching its cloud storage limit.');
}

async function mutate(uid: string, action: (state: CloudLibraryDocument) => CloudLibraryDocument) {
  ensureOnline();
  const { firestore } = getFirebaseServices();
  const ref = libraryRef(uid);
  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists() ? normalizeLibrary(snapshot.data()) : createEmptyLibrary();
    const next = action(current);
    validateSize(next);
    transaction.set(ref, next);
    return next;
  });
}

export function subscribeToLibrary(
  uid: string,
  onValue: (state: CloudLibraryDocument, fromCache: boolean) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const ref = libraryRef(uid);
  return onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
    if (snapshot.exists()) {
      onValue(normalizeLibrary(snapshot.data()), snapshot.metadata.fromCache);
      return;
    }
    void mutate(uid, () => createEmptyLibrary()).catch(onError);
  }, (error) => onError(error));
}

export const cloudLibrary = {
  saveStatus: (uid: string, tmdbId: number, status: SavedShowStatus, options?: { confirmUnrank?: boolean }) =>
    mutate(uid, (state) => applyStatusMutation(state, tmdbId, status, options)),
  saveReview: (uid: string, tmdbId: number, review: string) =>
    mutate(uid, (state) => applyReviewMutation(state, tmdbId, review)),
  deleteShow: (uid: string, tmdbId: number) => mutate(uid, (state) => applyDeleteMutation(state, tmdbId)),
  unrankShow: (uid: string, tmdbId: number) => mutate(uid, (state) => applyUnrankMutation(state, tmdbId)),
  commitRanking: (uid: string, draft: RankingDraft) => mutate(uid, (state) => applyRankingMutation(state, draft)),
};

