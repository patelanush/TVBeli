import type { SavedShowStatus } from '@/types/savedShow';

export type WatchStatus = SavedShowStatus;

export type TVShow = {
  id: string | number;
  title: string;
  year: number | null;
  genres: string[];
  description: string;
  seasons?: number;
  rating: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  accentColor: string;
  status?: WatchStatus;
};

export type TVCreator = {
  id: number;
  name: string;
  profileUrl: string | null;
};

export type TVCastMember = {
  id: number;
  name: string;
  character: string | null;
  profileUrl: string | null;
};

export type TVNetwork = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type TVSeason = {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airYear: number | null;
  overview: string;
  posterUrl: string | null;
};

export type TVShowDetails = TVShow & {
  productionStatus: string;
  episodeCount: number;
  creators: TVCreator[];
  cast: TVCastMember[];
  networks: TVNetwork[];
  seasonList: TVSeason[];
};
