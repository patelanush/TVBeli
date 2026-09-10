import type { TVShow } from '@/types/show';

export type SavedShowStatus = 'watched' | 'watching' | 'want_to_watch';

export type SavedShow = {
  tmdbId: number;
  status: SavedShowStatus;
  personalRating: number | null;
  review: string;
  rankPosition: number | null;
  ratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedShowSort = 'recently_added' | 'personal_rating' | 'title';

export type SavedShowWithMetadata = {
  saved: SavedShow;
  show: TVShow | null;
};

export type LibraryStats = {
  watched: number;
  watching: number;
  wantToWatch: number;
  averageRating: number | null;
};
