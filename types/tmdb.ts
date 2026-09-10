export type TmdbPaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbGenreResponse = {
  genres: TmdbGenre[];
};

export type TmdbTvResult = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date?: string;
  genre_ids: number[];
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
};

export type TmdbCreator = {
  id: number;
  name: string;
  profile_path: string | null;
};

export type TmdbNetwork = {
  id: number;
  name: string;
  logo_path: string | null;
};

export type TmdbSeason = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string;
  overview: string;
  poster_path: string | null;
};

export type TmdbAggregateCastMember = {
  id: number;
  name: string;
  order: number;
  profile_path: string | null;
  roles?: { character: string; episode_count: number }[];
};

export type TmdbAggregateCredits = {
  cast: TmdbAggregateCastMember[];
};

export type TmdbTvDetails = {
  id: number;
  name: string;
  overview: string;
  first_air_date?: string;
  genres: TmdbGenre[];
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  created_by: TmdbCreator[];
  networks: TmdbNetwork[];
  seasons: TmdbSeason[];
  aggregate_credits?: TmdbAggregateCredits;
};
