import type { TVShow } from '@/types/show';
import type { RankingInfo, Reaction } from '@/types/ranking';

export type SavedShowStatus = 'watched' | 'watching' | 'want_to_watch';

export type SavedShow = {
  tmdbId: number;
  status: SavedShowStatus;
  legacyManualRating: number | null;
  review: string;
  legacyRankPosition: number | null;
  legacyRatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedShowSort = 'recently_added' | 'ranking' | 'title';

export type SavedShowWithMetadata = {
  saved: SavedShow;
  show: TVShow | null;
  ranking: RankingInfo | null;
};

export type LibraryStats = {
  watched: number;
  watching: number;
  wantToWatch: number;
  totalRanked: number;
  counts: Record<Reaction, number>;
  averageScore: number | null;
};
