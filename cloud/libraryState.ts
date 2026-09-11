import { REACTION_ORDER } from '@/constants/reactions';
import { placeShow, removeShow } from '@/ranking/mutations';
import { assertRankingIntegrity, buildRankings, sortPreferenceGroups } from '@/ranking/order';
import type { CloudLibraryDocument } from '@/cloud/types';
import { CLOUD_LIBRARY_SCHEMA_VERSION } from '@/cloud/types';
import { NeedsUnrankConfirmationError, StaleRankingError, WatchedShowRequiredError } from '@/cloud/errors';
import type { RankingDraft, RankingSnapshot } from '@/types/ranking';
import type { LibraryStats, SavedShow, SavedShowStatus } from '@/types/savedShow';

export function createEmptyLibrary(now = new Date().toISOString()): CloudLibraryDocument {
  return {
    schemaVersion: CLOUD_LIBRARY_SCHEMA_VERSION,
    documentVersion: 0,
    rankingRevision: 0,
    nextGroupId: 1,
    savedShows: {},
    rankingGroups: [],
    updatedAt: now,
  };
}

function cloneLibrary(state: CloudLibraryDocument): CloudLibraryDocument {
  return {
    ...state,
    savedShows: Object.fromEntries(Object.entries(state.savedShows).map(([key, show]) => [key, { ...show }])),
    rankingGroups: state.rankingGroups.map((group) => ({
      ...group,
      members: group.members.map((member) => ({ ...member })),
    })),
  };
}

export function assertLibraryIntegrity(state: CloudLibraryDocument): void {
  if (state.schemaVersion !== CLOUD_LIBRARY_SCHEMA_VERSION) throw new Error('This library needs a newer version of TVBeli.');
  if (!Number.isSafeInteger(state.documentVersion) || state.documentVersion < 0) throw new Error('Invalid library version.');
  if (!Number.isSafeInteger(state.rankingRevision) || state.rankingRevision < 0) throw new Error('Invalid ranking revision.');
  if (!Number.isSafeInteger(state.nextGroupId) || state.nextGroupId < 1) throw new Error('Invalid next preference group ID.');
  assertRankingIntegrity(state.rankingGroups);
  if (state.rankingGroups.some((group) => group.id >= state.nextGroupId)) throw new Error('The next preference group ID is not ahead of existing groups.');
  for (const [key, show] of Object.entries(state.savedShows)) {
    if (key !== String(show.tmdbId) || !Number.isSafeInteger(show.tmdbId) || show.tmdbId < 1) throw new Error('Invalid saved TV show ID.');
    if (!['watched', 'watching', 'want_to_watch'].includes(show.status)) throw new Error('Invalid saved TV show status.');
    if (show.review.length > 500) throw new Error('A review is longer than 500 characters.');
  }
  for (const group of state.rankingGroups) {
    for (const member of group.members) {
      if (state.savedShows[String(member.tmdbId)]?.status !== 'watched') throw new Error('Only watched shows may have active rankings.');
    }
  }
}

export function normalizeLibrary(value: unknown): CloudLibraryDocument {
  if (!value || typeof value !== 'object') throw new Error('The cloud library is unreadable.');
  const state = value as CloudLibraryDocument;
  const normalized: CloudLibraryDocument = {
    schemaVersion: state.schemaVersion,
    documentVersion: state.documentVersion,
    rankingRevision: state.rankingRevision,
    nextGroupId: state.nextGroupId,
    savedShows: state.savedShows ?? {},
    rankingGroups: sortPreferenceGroups(state.rankingGroups ?? []),
    updatedAt: state.updatedAt,
  };
  assertLibraryIntegrity(normalized);
  return cloneLibrary(normalized);
}

function finish(state: CloudLibraryDocument, now: string, rankingChanged: boolean): CloudLibraryDocument {
  state.documentVersion += 1;
  if (rankingChanged) state.rankingRevision += 1;
  state.updatedAt = now;
  assertLibraryIntegrity(state);
  return state;
}

export function getSavedShowsFromState(state: CloudLibraryDocument): SavedShow[] {
  return Object.values(state.savedShows).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.tmdbId - b.tmdbId);
}

export function getRankingSnapshotFromState(state: CloudLibraryDocument): RankingSnapshot {
  return { revision: state.rankingRevision, groups: cloneLibrary(state).rankingGroups };
}

export function getLibraryStatsFromState(state: CloudLibraryDocument): LibraryStats {
  const saved = Object.values(state.savedShows);
  const rankings = buildRankings(state.rankingGroups);
  const counts = Object.fromEntries(REACTION_ORDER.map((reaction) => [reaction, 0])) as LibraryStats['counts'];
  let scoreTotal = 0;
  for (const ranking of rankings) {
    counts[ranking.reaction] += 1;
    scoreTotal += ranking.scoreTenths;
  }
  return {
    watched: saved.filter((show) => show.status === 'watched').length,
    watching: saved.filter((show) => show.status === 'watching').length,
    wantToWatch: saved.filter((show) => show.status === 'want_to_watch').length,
    totalRanked: rankings.length,
    counts,
    averageScore: rankings.length ? scoreTotal / rankings.length / 10 : null,
  };
}

export function applyStatusMutation(
  source: CloudLibraryDocument,
  tmdbId: number,
  status: SavedShowStatus,
  options: { confirmUnrank?: boolean } = {},
  now = new Date().toISOString(),
): CloudLibraryDocument {
  const state = cloneLibrary(source);
  const ranked = state.rankingGroups.some((group) => group.members.some((member) => member.tmdbId === tmdbId));
  if (ranked && status !== 'watched' && !options.confirmUnrank) throw new NeedsUnrankConfirmationError();
  if (ranked && status !== 'watched') state.rankingGroups = removeShow(state.rankingGroups, tmdbId, now);
  const existing = state.savedShows[String(tmdbId)];
  state.savedShows[String(tmdbId)] = existing
    ? { ...existing, status, updatedAt: now }
    : { tmdbId, status, legacyManualRating: null, review: '', legacyRankPosition: null, legacyRatedAt: null, createdAt: now, updatedAt: now };
  return finish(state, now, ranked && status !== 'watched');
}

export function applyReviewMutation(source: CloudLibraryDocument, tmdbId: number, review: string, now = new Date().toISOString()): CloudLibraryDocument {
  if (review.length > 500) throw new Error('Keep your review to 500 characters or fewer.');
  const state = cloneLibrary(source);
  const saved = state.savedShows[String(tmdbId)];
  if (!saved) throw new Error('Save this show to My Shows before writing a review.');
  state.savedShows[String(tmdbId)] = { ...saved, review: review.trim(), updatedAt: now };
  return finish(state, now, false);
}

export function applyDeleteMutation(source: CloudLibraryDocument, tmdbId: number, now = new Date().toISOString()): CloudLibraryDocument {
  const state = cloneLibrary(source);
  const ranked = state.rankingGroups.some((group) => group.members.some((member) => member.tmdbId === tmdbId));
  if (ranked) state.rankingGroups = removeShow(state.rankingGroups, tmdbId, now);
  delete state.savedShows[String(tmdbId)];
  return finish(state, now, ranked);
}

export function applyUnrankMutation(source: CloudLibraryDocument, tmdbId: number, now = new Date().toISOString()): CloudLibraryDocument {
  const state = cloneLibrary(source);
  const ranked = state.rankingGroups.some((group) => group.members.some((member) => member.tmdbId === tmdbId));
  if (!ranked) return state;
  state.rankingGroups = removeShow(state.rankingGroups, tmdbId, now);
  const saved = state.savedShows[String(tmdbId)];
  if (saved) state.savedShows[String(tmdbId)] = { ...saved, updatedAt: now };
  return finish(state, now, true);
}

export function applyRankingMutation(source: CloudLibraryDocument, draft: RankingDraft, now = new Date().toISOString()): CloudLibraryDocument {
  if (source.rankingRevision !== draft.expectedRevision) throw new StaleRankingError();
  const state = cloneLibrary(source);
  const saved = state.savedShows[String(draft.tmdbId)];
  if (saved?.status !== 'watched') throw new WatchedShowRequiredError();
  let groups = placeShow(state.rankingGroups, draft, now);
  if (groups.some((group) => group.id === -1)) {
    const id = state.nextGroupId++;
    groups = groups.map((group) => group.id === -1 ? { ...group, id } : group);
  }
  state.rankingGroups = groups;
  state.savedShows[String(draft.tmdbId)] = { ...saved, updatedAt: now };
  return finish(state, now, true);
}
