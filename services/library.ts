import { getTvSummary } from '@/services/tmdb';
import type { RankingInfo } from '@/types/ranking';
import type { SavedShow, SavedShowWithMetadata } from '@/types/savedShow';

type HydrationOptions = {
  isCancelled?: () => boolean;
  onBatch?: (items: SavedShowWithMetadata[]) => void;
};

/** Metadata is optional: personal data remains usable when TMDB is unavailable. */
export async function hydrateSavedShows(
  savedShows: SavedShow[],
  rankings: RankingInfo[] = [],
  options: HydrationOptions = {},
): Promise<SavedShowWithMetadata[]> {
  const rankingById = new Map(rankings.map((ranking) => [ranking.tmdbId, ranking]));
  const items: SavedShowWithMetadata[] = savedShows.map((saved) => ({
    saved,
    show: null,
    ranking: rankingById.get(saved.tmdbId) ?? null,
  }));

  // A library can contain hundreds of shows. Limit concurrent TMDB requests.
  for (let start = 0; start < savedShows.length; start += 4) {
    if (options.isCancelled?.()) break;
    const batch = savedShows.slice(start, start + 4);
    const results = await Promise.allSettled(batch.map((saved) => getTvSummary(saved.tmdbId)));
    if (options.isCancelled?.()) break;
    const hydrated = results.map((result, offset) => ({
      ...items[start + offset],
      show: result.status === 'fulfilled' ? result.value : null,
    }));
    hydrated.forEach((item, offset) => { items[start + offset] = item; });
    options.onBatch?.(hydrated);
  }
  return items;
}
