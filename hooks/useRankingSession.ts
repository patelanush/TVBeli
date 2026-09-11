import { useCallback, useEffect, useRef, useState } from 'react';

import { getRankingSnapshotFromState } from '@/cloud/libraryState';
import { useLibrary } from '@/contexts/LibraryContext';
import { answerComparison, createInsertionSession, getComparisonGroup } from '@/ranking/insertion';
import type { ComparisonAnswer, InsertionSession, RankingSnapshot, Reaction } from '@/types/ranking';

export type RankingMode = 'new' | 'rerank' | 'change';

/** Owns a disposable draft. Only commitRanking can write the final placement. */
export function useRankingSession(tmdbId: number, mode: RankingMode) {
  const library = useLibrary();
  const libraryRef = useRef(library);
  libraryRef.current = library;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RankingSnapshot | null>(null);
  const [session, setSession] = useState<InsertionSession | null>(null);
  const [history, setHistory] = useState<InsertionSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RankingSnapshot | null>(null);
  const currentSession = useRef<InsertionSession | null>(null);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    setResult(null);
    setSession(null);
    currentSession.current = null;
    setHistory([]);
    try {
      if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) throw new Error('This show could not be identified.');
      const currentLibrary = libraryRef.current;
      if (!currentLibrary.state) throw new Error(currentLibrary.error ?? 'Your cloud library is still loading.');
      const saved = currentLibrary.state.savedShows[String(tmdbId)] ?? null;
      const nextSnapshot = getRankingSnapshotFromState(currentLibrary.state);
      if (!mounted.current || request !== generation.current) return;
      if (saved?.status !== 'watched') throw new Error('Mark this show Watched on its detail page before rating and ranking it.');
      setSnapshot(nextSnapshot);
      const existing = nextSnapshot.groups.find((group) => group.members.some((member) => member.tmdbId === tmdbId));
      if (mode === 'rerank' && existing) {
        const draft = createInsertionSession(nextSnapshot.groups, tmdbId, existing.reaction);
        // An empty tier still asks for the reaction so opening a screen never writes.
        if (!draft.placement) { currentSession.current = draft; setSession(draft); }
      }
    } catch (error) {
      if (mounted.current && request === generation.current) setLoadError(error instanceof Error ? error.message : 'Your library could not be loaded.');
    } finally {
      if (mounted.current && request === generation.current) setLoading(false);
    }
  }, [tmdbId, mode]);

  useEffect(() => {
    mounted.current = true;
    // Defers state reset to the async initialization boundary, including route changes.
    if (!library.loading) void Promise.resolve().then(load);
    return () => { mounted.current = false; generation.current += 1; };
  }, [library.loading, load]);

  const commit = useCallback(async (draft: InsertionSession) => {
    if (!snapshot || !draft.placement || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const completed = await libraryRef.current.commitRanking({
        tmdbId,
        reaction: draft.reaction,
        placement: draft.placement,
        expectedRevision: snapshot.revision,
      });
      if (mounted.current) setResult(completed);
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : 'Your ranking could not be saved. Your previous ranking is unchanged.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }, [snapshot, tmdbId]);

  const chooseReaction = (reaction: Reaction) => {
    if (!snapshot || loading || savingRef.current || result) return;
    const draft = createInsertionSession(snapshot.groups, tmdbId, reaction);
    currentSession.current = draft;
    setSession(draft);
    setHistory([]);
    setSaveError(null);
    if (draft.placement) void commit(draft);
  };

  const answer = (value: ComparisonAnswer, groupId: number) => {
    const draft = currentSession.current;
    if (!draft || savingRef.current || result || getComparisonGroup(draft)?.id !== groupId) return;
    const next = answerComparison(draft, value);
    // Updating the ref immediately rejects a second tap on the previous opponent.
    currentSession.current = next;
    setHistory((previous) => [...previous, draft]);
    setSession(next);
    if (next.placement) void commit(next);
  };

  const back = () => {
    if (savingRef.current || result) return;
    setSaveError(null);
    const previous = history.at(-1) ?? null;
    currentSession.current = previous;
    setSession(previous);
    setHistory((items) => items.slice(0, -1));
  };

  return {
    loading, loadError, saveError, session, saving, result,
    opponentGroup: session ? getComparisonGroup(session) : null,
    chooseReaction, answer, back,
    restart: load,
    retrySave: () => { if (currentSession.current) void commit(currentSession.current); },
  };
}
