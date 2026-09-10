import { TVShow, TVShowDetails } from '@/types/show';
import {
  TmdbGenreResponse,
  TmdbPaginatedResponse,
  TmdbTvDetails,
  TmdbTvResult,
} from '@/types/tmdb';
import { getBackdropUrl, getLogoUrl, getPosterUrl, getProfileUrl } from '@/utils/tmdbImages';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_LANGUAGE = 'en-US';
const ACCENT_COLORS = ['#E45A50', '#2B77B9', '#C79A57', '#D04435', '#36727A', '#7459AB'];
const summaryCache = new Map<number, Promise<TVShow>>();

type RequestParams = Record<string, string | number | boolean | undefined>;
type RequestOptions = {
  params?: RequestParams;
  signal?: AbortSignal;
};

export class TmdbApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TmdbApiError';
    this.status = status;
  }
}

function getAccessToken() {
  const token = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new TmdbApiError(
      'TMDB is not configured yet. Add EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN to your .env file.',
    );
  }
  return token;
}

function buildQuery(params: RequestParams = {}) {
  const query = Object.entries({ language: DEFAULT_LANGUAGE, ...params })
    .flatMap(([key, value]) => value === undefined
      ? []
      : `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}${buildQuery(options.params)}`, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      signal: options.signal,
    });

    if (!response.ok) {
      const message = response.status === 401
        ? 'TMDB rejected the access token. Check the value in your .env file.'
        : 'TMDB could not load this content. Please try again.';
      throw new TmdbApiError(message, response.status);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof TmdbApiError || (error instanceof Error && error.name === 'AbortError')) {
      throw error;
    }
    throw new TmdbApiError('Unable to reach TMDB. Check your connection and try again.');
  }
}

function getYear(date?: string) {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function getRating(average: number, voteCount: number) {
  return average > 0 && voteCount > 0 ? Math.round(average * 10) / 10 : null;
}

function getAccentColor(id: number) {
  return ACCENT_COLORS[Math.abs(id) % ACCENT_COLORS.length];
}

let genreMapPromise: Promise<Map<number, string>> | null = null;

export function getTvGenres() {
  if (!genreMapPromise) {
    genreMapPromise = request<TmdbGenreResponse>('/genre/tv/list')
      .then(({ genres }) => new Map(genres.map((genre) => [genre.id, genre.name])))
      .catch((error) => {
        genreMapPromise = null;
        throw error;
      });
  }
  return genreMapPromise;
}

function normalizeTvResult(result: TmdbTvResult, genres: Map<number, string>): TVShow {
  return {
    id: result.id,
    title: result.name || result.original_name,
    year: getYear(result.first_air_date),
    genres: result.genre_ids.map((id) => genres.get(id)).filter((name): name is string => Boolean(name)),
    description: result.overview,
    rating: getRating(result.vote_average, result.vote_count),
    posterUrl: getPosterUrl(result.poster_path),
    backdropUrl: getBackdropUrl(result.backdrop_path),
    accentColor: getAccentColor(result.id),
  };
}

async function getTvList(path: string, signal?: AbortSignal) {
  const [response, genres] = await Promise.all([
    request<TmdbPaginatedResponse<TmdbTvResult>>(path, { params: { page: 1 }, signal }),
    getTvGenres(),
  ]);
  return response.results.map((result) => normalizeTvResult(result, genres));
}

export function getTrendingTv(signal?: AbortSignal) {
  return getTvList('/trending/tv/week', signal);
}

export function getPopularTv(signal?: AbortSignal) {
  return getTvList('/tv/popular', signal);
}

export function getTopRatedTv(signal?: AbortSignal) {
  return getTvList('/tv/top_rated', signal);
}

export async function searchTv(query: string, signal?: AbortSignal) {
  const [response, genres] = await Promise.all([
    request<TmdbPaginatedResponse<TmdbTvResult>>('/search/tv', {
      params: { query: query.trim(), include_adult: false, page: 1 },
      signal,
    }),
    getTvGenres(),
  ]);
  return response.results.map((result) => normalizeTvResult(result, genres));
}

export async function getTvDetails(seriesId: number, signal?: AbortSignal): Promise<TVShowDetails> {
  const details = await request<TmdbTvDetails>(`/tv/${seriesId}`, {
    params: { append_to_response: 'aggregate_credits' },
    signal,
  });

  return {
    id: details.id,
    title: details.name,
    year: getYear(details.first_air_date),
    genres: details.genres.map((genre) => genre.name),
    description: details.overview,
    seasons: details.number_of_seasons,
    rating: getRating(details.vote_average, details.vote_count),
    posterUrl: getPosterUrl(details.poster_path, 'w500'),
    backdropUrl: getBackdropUrl(details.backdrop_path),
    accentColor: getAccentColor(details.id),
    productionStatus: details.status,
    episodeCount: details.number_of_episodes,
    creators: details.created_by.map((creator) => ({
      id: creator.id,
      name: creator.name,
      profileUrl: getProfileUrl(creator.profile_path),
    })),
    networks: details.networks.map((network) => ({
      id: network.id,
      name: network.name,
      logoUrl: getLogoUrl(network.logo_path),
    })),
    cast: (details.aggregate_credits?.cast ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, 10)
      .map((member) => ({
        id: member.id,
        name: member.name,
        character: member.roles?.[0]?.character || null,
        profileUrl: getProfileUrl(member.profile_path),
      })),
    seasonList: details.seasons
      .filter((season) => season.season_number > 0)
      .map((season) => ({
        id: season.id,
        name: season.name,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        airYear: getYear(season.air_date),
        overview: season.overview,
        posterUrl: getPosterUrl(season.poster_path),
      })),
  };
}

function normalizeTvDetailsSummary(details: TmdbTvDetails): TVShow {
  return {
    id: details.id,
    title: details.name,
    year: getYear(details.first_air_date),
    genres: details.genres.map((genre) => genre.name),
    description: details.overview,
    rating: getRating(details.vote_average, details.vote_count),
    posterUrl: getPosterUrl(details.poster_path),
    backdropUrl: getBackdropUrl(details.backdrop_path),
    accentColor: getAccentColor(details.id),
  };
}

export function getTvSummary(seriesId: number, signal?: AbortSignal): Promise<TVShow> {
  if (signal) {
    return request<TmdbTvDetails>(`/tv/${seriesId}`, { signal }).then(normalizeTvDetailsSummary);
  }

  const cached = summaryCache.get(seriesId);
  if (cached) return cached;

  const pending = request<TmdbTvDetails>(`/tv/${seriesId}`)
    .then(normalizeTvDetailsSummary)
    .catch((error) => {
      summaryCache.delete(seriesId);
      throw error;
    });
  summaryCache.set(seriesId, pending);
  return pending;
}
