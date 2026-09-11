import assert from 'node:assert/strict';
import test from 'node:test';

import { NeedsUnrankConfirmationError, StaleRankingError } from '../cloud/errors';
import {
  applyDeleteMutation,
  applyRankingMutation,
  applyReviewMutation,
  applyStatusMutation,
  createEmptyLibrary,
  getLibraryStatsFromState,
} from '../cloud/libraryState';
import { buildRankings } from '../ranking/order';

const now = '2026-09-10T00:00:00.000Z';

function watched(ids: number[]) {
  return ids.reduce((state, id) => applyStatusMutation(state, id, 'watched', {}, now), createEmptyLibrary(now));
}

test('cloud state persists statuses and reviews without changing ranking revision', () => {
  let state = applyStatusMutation(createEmptyLibrary(now), 101, 'watched', {}, now);
  state = applyReviewMutation(state, 101, 'Excellent finale', now);
  assert.equal(state.savedShows['101'].review, 'Excellent finale');
  assert.equal(state.rankingRevision, 0);
  assert.equal(state.documentVersion, 2);
});

test('transaction draft commits one group and rejects stale drafts', () => {
  const source = watched([1, 2]);
  const first = applyRankingMutation(source, { tmdbId: 1, reaction: 'LOVE', placement: { kind: 'insert', index: 0 }, expectedRevision: 0 }, now);
  assert.equal(first.rankingGroups[0].id, 1);
  assert.equal(first.nextGroupId, 2);
  assert.throws(() => applyRankingMutation(first, { tmdbId: 2, reaction: 'LOVE', placement: { kind: 'insert', index: 1 }, expectedRevision: 0 }, now), StaleRankingError);
});

test('true ties share a group and competition rank', () => {
  let state = watched([1, 2, 3]);
  state = applyRankingMutation(state, { tmdbId: 1, reaction: 'LOVE', placement: { kind: 'insert', index: 0 }, expectedRevision: state.rankingRevision }, now);
  state = applyRankingMutation(state, { tmdbId: 2, reaction: 'LOVE', placement: { kind: 'tie', groupId: 1 }, expectedRevision: state.rankingRevision }, now);
  state = applyRankingMutation(state, { tmdbId: 3, reaction: 'LOVE', placement: { kind: 'insert', index: 1 }, expectedRevision: state.rankingRevision }, now);
  assert.deepEqual(buildRankings(state.rankingGroups).map((item) => item.overallRank), [1, 1, 3]);
  assert.equal(state.rankingGroups[0].members.length, 2);
});

test('ranked status changes require confirmation and atomically compact groups', () => {
  let state = watched([1, 2]);
  state = applyRankingMutation(state, { tmdbId: 1, reaction: 'LIKE', placement: { kind: 'insert', index: 0 }, expectedRevision: state.rankingRevision }, now);
  state = applyRankingMutation(state, { tmdbId: 2, reaction: 'LIKE', placement: { kind: 'insert', index: 1 }, expectedRevision: state.rankingRevision }, now);
  assert.throws(() => applyStatusMutation(state, 1, 'watching', {}, now), NeedsUnrankConfirmationError);
  const changed = applyStatusMutation(state, 1, 'watching', { confirmUnrank: true }, now);
  assert.equal(changed.savedShows['1'].status, 'watching');
  assert.equal(changed.rankingGroups.length, 1);
  assert.equal(changed.rankingGroups[0].sortOrder, 0);
});

test('deleting one member keeps the rest of its tie group', () => {
  let state = watched([1, 2]);
  state = applyRankingMutation(state, { tmdbId: 1, reaction: 'MID', placement: { kind: 'insert', index: 0 }, expectedRevision: state.rankingRevision }, now);
  state = applyRankingMutation(state, { tmdbId: 2, reaction: 'MID', placement: { kind: 'tie', groupId: 1 }, expectedRevision: state.rankingRevision }, now);
  state = applyDeleteMutation(state, 1, now);
  assert.equal(state.savedShows['1'], undefined);
  assert.deepEqual(state.rankingGroups[0].members.map((member) => member.tmdbId), [2]);
});

test('cloud statistics are derived from authoritative preference order', () => {
  let state = watched([1, 2]);
  state = applyStatusMutation(state, 3, 'want_to_watch', {}, now);
  state = applyRankingMutation(state, { tmdbId: 1, reaction: 'LOVE', placement: { kind: 'insert', index: 0 }, expectedRevision: state.rankingRevision }, now);
  state = applyRankingMutation(state, { tmdbId: 2, reaction: 'LIKE', placement: { kind: 'insert', index: 0 }, expectedRevision: state.rankingRevision }, now);
  const stats = getLibraryStatsFromState(state);
  assert.deepEqual({ watched: stats.watched, ranked: stats.totalRanked, love: stats.counts.LOVE, like: stats.counts.LIKE, watchlist: stats.wantToWatch }, { watched: 2, ranked: 2, love: 1, like: 1, watchlist: 1 });
});
