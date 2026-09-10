import { getTvSummary } from '@/services/tmdb';
import { SavedShow, SavedShowWithMetadata } from '@/types/savedShow';

export async function hydrateSavedShows(savedShows: SavedShow[]): Promise<SavedShowWithMetadata[]> {
  const results = await Promise.allSettled(savedShows.map((saved) => getTvSummary(saved.tmdbId)));
  return savedShows.map((saved, index) => ({
    saved,
    show: results[index].status === 'fulfilled' ? results[index].value : null,
  }));
}
