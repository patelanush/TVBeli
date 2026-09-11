import { useCallback, useEffect, useRef, useState } from 'react';

import { getLibraryStatsFromState, getSavedShowsFromState } from '@/cloud/libraryState';
import { useLibrary } from '@/contexts/LibraryContext';
import { buildRankings } from '@/ranking/order';
import { hydrateSavedShows } from '@/services/library';
import type { LibraryStats, SavedShowWithMetadata } from '@/types/savedShow';

export function usePersonalLibrary() {
  const cloud = useLibrary();
  const generation = useRef(0);
  const [items, setItems] = useState<SavedShowWithMetadata[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    const current = ++generation.current;
    const isCancelled = () => current !== generation.current;
    if (!cloud.state) {
      setLoading(cloud.loading);
      setError(cloud.error);
      return () => { generation.current += 1; };
    }
    setLoading(false);
    setError(null);
    setMetadataError(false);

    void (async () => {
      try {
        const saved = getSavedShowsFromState(cloud.state!);
        const nextStats = getLibraryStatsFromState(cloud.state!);
        const snapshot = { revision: cloud.state!.rankingRevision, groups: cloud.state!.rankingGroups };
        if (isCancelled()) return;
        const rankings = buildRankings(snapshot.groups);
        const rankingById = new Map(rankings.map((ranking) => [ranking.tmdbId, ranking]));
        setStats(nextStats);
        setItems((previous) => {
          const metadata = new Map(previous.map((item) => [item.saved.tmdbId, item.show]));
          return saved.map((row) => ({
            saved: row,
            show: metadata.get(row.tmdbId) ?? null,
            ranking: rankingById.get(row.tmdbId) ?? null,
          }));
        });
        setHydrating(saved.length > 0);

        const hydrated = await hydrateSavedShows(saved, rankings, {
          isCancelled,
          onBatch: (batch) => {
            if (isCancelled()) return;
            const updates = new Map(batch.map((item) => [item.saved.tmdbId, item]));
            setItems((previous) => previous.map((item) => {
              const update = updates.get(item.saved.tmdbId);
              return update ? { ...update, show: update.show ?? item.show } : item;
            }));
            if (batch.some((item) => !item.show)) setMetadataError(true);
          },
        });
        if (!isCancelled()) {
          setMetadataError(hydrated.some((item) => !item.show));
          setHydrating(false);
        }
      } catch {
        if (!isCancelled()) {
          setError('Your cloud library could not be loaded. Please try again.');
          setLoading(false);
          setHydrating(false);
        }
      }
    })();

    return () => { generation.current += 1; };
  }, [cloud.error, cloud.loading, cloud.state, retryKey]);

  return { items, stats, loading, hydrating, error, metadataError, retry, online: cloud.online, fromCache: cloud.fromCache };
}
