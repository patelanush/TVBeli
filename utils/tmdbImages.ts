const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

type PosterSize = 'w185' | 'w342' | 'w500';
type BackdropSize = 'w780' | 'w1280';
type ProfileSize = 'w185' | 'h632';
type LogoSize = 'w92' | 'w154' | 'w300';

function buildImageUrl(path: string | null | undefined, size: string) {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

export function getPosterUrl(path: string | null | undefined, size: PosterSize = 'w342') {
  return buildImageUrl(path, size);
}

export function getBackdropUrl(path: string | null | undefined, size: BackdropSize = 'w780') {
  return buildImageUrl(path, size);
}

export function getProfileUrl(path: string | null | undefined, size: ProfileSize = 'w185') {
  return buildImageUrl(path, size);
}

export function getLogoUrl(path: string | null | undefined, size: LogoSize = 'w154') {
  return buildImageUrl(path, size);
}
