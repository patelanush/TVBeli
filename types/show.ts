export type WatchStatus = 'watched' | 'watching' | 'watchlist';

export type TVShow = {
  id: string;
  title: string;
  year: number;
  genres: string[];
  description: string;
  seasons: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  accentColor: string;
  status?: WatchStatus;
};

export type FriendActivity = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  action: string;
  showId: string;
  rating?: number;
  timeAgo: string;
};
