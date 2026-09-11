import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { REACTION_ORDER, REACTIONS } from '../constants/reactions';
import { answerComparison, createInsertionSession, getComparisonGroup } from '../ranking/insertion';
import { placeShow, removeShow } from '../ranking/mutations';
import { assertRankingIntegrity, buildRankings } from '../ranking/order';
import { calculateTargetScore, recalibrateTier } from '../ranking/scores';
import type { InsertionSession, PreferenceGroup, Reaction } from '../types/ranking';

const THEN = '2026-01-01T00:00:00.000Z';
const NOW = '2026-09-09T12:00:00.000Z';

function makeTier(reaction: Reaction, count: number, startId = 1): PreferenceGroup[] {
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    reaction,
    sortOrder: index,
    displayedScoreTenths: calculateTargetScore(reaction, index, count),
    members: [{ tmdbId: startId + index, rankedAt: THEN }],
    createdAt: THEN,
    updatedAt: THEN,
  }));
}

function persistNewId(groups: PreferenceGroup[], id: number): PreferenceGroup[] {
  return groups.map((group) => group.id === -1 ? { ...group, id } : group);
}

function insertAt(groups: PreferenceGroup[], tmdbId: number, reaction: Reaction, index: number): PreferenceGroup[] {
  return persistNewId(placeShow(groups, { tmdbId, reaction, placement: { kind: 'insert', index } }, NOW), tmdbId);
}

function finishAt(session: InsertionSession, index: number): InsertionSession {
  let current = session;
  while (!current.placement) {
    const middle = Math.floor((current.low + current.high) / 2);
    current = answerComparison(current, index <= middle ? 'candidate' : 'existing');
  }
  return current;
}

function finishTied(session: InsertionSession, index: number): InsertionSession {
  let current = session;
  while (!current.placement) {
    const middle = Math.floor((current.low + current.high) / 2);
    current = answerComparison(current, index === middle ? 'equal' : index < middle ? 'candidate' : 'existing');
  }
  return current;
}

function memberGroup(groups: PreferenceGroup[], tmdbId: number): PreferenceGroup {
  const group = groups.find((entry) => entry.members.some((member) => member.tmdbId === tmdbId));
  assert.ok(group);
  return group;
}

describe('reaction tiers and score targets', () => {
  for (const reaction of REACTION_ORDER) {
    it(`places the first ${reaction} show without comparisons at the top of its band`, () => {
      const session = createInsertionSession([], 42, reaction);
      assert.deepEqual(session.placement, { kind: 'insert', index: 0 });
      assert.equal(getComparisonGroup(session), null);
      const groups = insertAt([], 42, reaction, 0);
      assert.equal(groups[0].displayedScoreTenths, REACTIONS[reaction].maxTenths);
      assert.equal(buildRankings(groups)[0].overallRank, 1);
      assertRankingIntegrity(groups);
    });

    it(`keeps integer ${reaction} targets inside the band for tiers of size 1–200`, () => {
      for (let count = 1; count <= 200; count += 1) {
        const scores = makeTier(reaction, count).map((group) => group.displayedScoreTenths);
        scores.forEach((score, index) => {
          assert.ok(Number.isInteger(score));
          assert.ok(score >= REACTIONS[reaction].minTenths && score <= REACTIONS[reaction].maxTenths);
          if (index > 0) assert.ok(score <= scores[index - 1]);
          if (reaction === 'LOVE' && index > 0) assert.ok(score < 100);
        });
      }
    });
  }

  it('uses 10.0, 9.9, 9.8, 9.7 for four LOVE group targets', () => {
    assert.deepEqual(makeTier('LOVE', 4).map((group) => group.displayedScoreTenths), [100, 99, 98, 97]);
    let groups: PreferenceGroup[] = [];
    for (let id = 1; id <= 4; id += 1) groups = insertAt(groups, id, 'LOVE', groups.length);
    assert.deepEqual(groups.map((group) => group.displayedScoreTenths), [100, 99, 98, 97]);
  });

  it('rejects invalid target positions', () => {
    assert.throws(() => calculateTargetScore('LOVE', 0, 0));
    assert.throws(() => calculateTargetScore('LOVE', -1, 4));
    assert.throws(() => calculateTargetScore('LIKE', 4, 4));
    assert.throws(() => calculateTargetScore('MID', 1.5, 4));
  });
});

describe('binary insertion sessions', () => {
  for (const count of [0, 1, 4, 50, 100]) {
    it(`finds every insertion slot among ${count} groups`, () => {
      const groups = makeTier('LOVE', count);
      for (let slot = 0; slot <= count; slot += 1) {
        const session = finishAt(createInsertionSession(groups, 999, 'LOVE'), slot);
        assert.deepEqual(session.placement, { kind: 'insert', index: slot });
        assert.ok(session.comparisons <= (count === 0 ? 0 : Math.ceil(Math.log2(count + 1))));
        if (count === 50) assert.ok(session.comparisons <= 6);
        assert.equal(getComparisonGroup(session), null);
      }
    });

    if (count > 0) it(`finds every possible true tie among ${count} groups`, () => {
      const groups = makeTier('LIKE', count);
      for (let target = 0; target < count; target += 1) {
        const session = finishTied(createInsertionSession(groups, 999, 'LIKE'), target);
        assert.deepEqual(session.placement, { kind: 'tie', groupId: groups[target].id });
        if (count === 50) assert.ok(session.comparisons <= 6);
      }
    });
  }

  it('offers all three meaningful outcomes against one group', () => {
    const session = createInsertionSession(makeTier('LOVE', 1), 999, 'LOVE');
    assert.deepEqual(answerComparison(session, 'candidate').placement, { kind: 'insert', index: 0 });
    assert.deepEqual(answerComparison(session, 'equal').placement, { kind: 'tie', groupId: 1 });
    assert.deepEqual(answerComparison(session, 'existing').placement, { kind: 'insert', index: 1 });
    assert.equal(session.comparisons, 0);
    assert.equal(session.placement, null);
  });

  it('uses the middle group and never compares across reactions', () => {
    const groups = [...makeTier('LOVE', 50), ...makeTier('MID', 7, 100)];
    const session = createInsertionSession(groups, 999, 'LOVE');
    assert.equal(getComparisonGroup(session)?.id, 26);
    assert.equal(session.groups.length, 50);
    assert.ok(session.groups.every((group) => group.reaction === 'LOVE'));
  });

  it('logically excludes a reranked singleton without touching the source snapshot', () => {
    const groups = makeTier('LOVE', 4);
    const before = structuredClone(groups);
    let session = createInsertionSession(groups, 2, 'LOVE');
    assert.equal(session.groups.length, 3);
    assert.deepEqual(session.groups.map((group) => group.sortOrder), [0, 1, 2]);
    assert.ok(session.groups.every((group) => group.members.every((member) => member.tmdbId !== 2)));
    session = answerComparison(session, 'candidate');
    assert.ok(session.comparisons > 0);
    // Cancel simply discards session; no restore or compensating mutation.
    assert.deepEqual(groups, before);
  });

  it('keeps the remaining members of a draft tie together', () => {
    const groups = makeTier('LOVE', 3);
    groups[1].members.push({ tmdbId: 20, rankedAt: THEN }, { tmdbId: 21, rankedAt: THEN });
    const session = createInsertionSession(groups, 2, 'LOVE');
    assert.deepEqual(session.groups[1].members.map((member) => member.tmdbId), [20, 21]);
    assert.equal(groups[1].members.length, 3);
  });

  it('does not accept another answer after completion', () => {
    const session = answerComparison(createInsertionSession(makeTier('LOVE', 1), 50, 'LOVE'), 'equal');
    assert.throws(() => answerComparison(session, 'candidate'), /complete/);
  });
});

describe('true ties and competition ranks', () => {
  for (const index of [0, 2, 4]) {
    it(`joins preference group ${index + 1} without manufacturing a new level`, () => {
      const original = makeTier('LOVE', 5);
      const groups = placeShow(original, { tmdbId: 20, reaction: 'LOVE', placement: { kind: 'tie', groupId: index + 1 } }, NOW);
      assert.equal(groups.length, 5);
      assert.equal(groups[index].members.length, 2);
      assert.deepEqual(groups.map((group) => group.displayedScoreTenths), original.map((group) => group.displayedScoreTenths));
      const rankings = buildRankings(groups);
      const first = rankings.find((ranking) => ranking.tmdbId === index + 1)!;
      const tied = rankings.find((ranking) => ranking.tmdbId === 20)!;
      assert.equal(first.overallRank, tied.overallRank);
      assert.equal(first.scoreTenths, tied.scoreTenths);
      assert.equal(tied.tieSize, 2);
      assertRankingIntegrity(groups);
    });
  }

  it('uses #1, #1, #3 and retains competition ranks across tier boundaries', () => {
    const groups = [...makeTier('LOVE', 2), ...makeTier('LIKE', 1, 10)];
    groups[0].members.push({ tmdbId: 3, rankedAt: THEN });
    const rankings = buildRankings(groups);
    assert.deepEqual(rankings.map((ranking) => ranking.overallRank), [1, 1, 3, 4]);
    assert.deepEqual(rankings.map((ranking) => ranking.tmdbId), [1, 3, 2, 10]);
  });

  it('allows 50 LOVE groups to share scores while retaining 50 distinct ranks', () => {
    const groups = makeTier('LOVE', 50);
    const rankings = buildRankings(groups);
    assert.equal(new Set(rankings.map((ranking) => ranking.scoreTenths)).size, 16);
    assert.equal(new Set(rankings.map((ranking) => ranking.overallRank)).size, 50);
    assert.ok(rankings.every((ranking) => ranking.tieSize === 1));
    assertRankingIntegrity(groups);
  });

  it('orders by tier and preference structure even when input arrays are shuffled', () => {
    const groups = [...makeTier('DISLIKE', 1, 40), ...makeTier('MID', 1, 30), ...makeTier('LIKE', 1, 20), ...makeTier('LOVE', 2, 10).reverse()];
    assert.deepEqual(buildRankings(groups).map((ranking) => ranking.tmdbId), [10, 11, 20, 30, 40]);
  });

  it('removes one tie member without score drift and preserves the other members', () => {
    const groups = makeTier('LOVE', 4);
    groups[1].members.push({ tmdbId: 20, rankedAt: THEN }, { tmdbId: 21, rankedAt: THEN });
    const changed = removeShow(groups, 2, NOW);
    assert.deepEqual(changed[1].members.map((member) => member.tmdbId), [20, 21]);
    assert.equal(changed[1].id, 2);
    assert.deepEqual(changed.map((group) => group.displayedScoreTenths), groups.map((group) => group.displayedScoreTenths));
    assert.deepEqual(buildRankings(changed).map((ranking) => ranking.overallRank), [1, 2, 2, 4, 5]);
  });
});

describe('deterministic score recomputation', () => {
  it('recomputes every score in a tier after an insertion shifts the ranking', () => {
    const original = makeTier('LOVE', 4);
    const changed = insertAt(original, 20, 'LOVE', 0);
    assert.equal(buildRankings(changed).find((ranking) => ranking.tmdbId === 3)?.overallRank, 4);
    assert.deepEqual(changed.map((group) => group.displayedScoreTenths), [100, 99, 98, 97, 96]);
    assert.equal(memberGroup(changed, 3).displayedScoreTenths, 97);
    assertRankingIntegrity(changed);
  });

  it('replaces historical sticky values with exact position targets', () => {
    const groups = makeTier('LIKE', 4);
    groups.forEach((group) => { group.displayedScoreTenths = 70; });
    const recalibrated = recalibrateTier(groups);
    assert.deepEqual(recalibrated.map((group) => group.displayedScoreTenths), [84, 83, 82, 81]);
    assert.deepEqual(groups.map((group) => group.displayedScoreTenths), [70, 70, 70, 70]);
  });

  it('does not let prior scores constrain a newly inserted score', () => {
    const groups = makeTier('LIKE', 5);
    groups.forEach((group) => { group.displayedScoreTenths = 84; });
    const changed = insertAt(groups, 20, 'LIKE', 2);
    assert.equal(calculateTargetScore('LIKE', 2, 6), 82);
    assert.equal(memberGroup(changed, 20).displayedScoreTenths, 82);
    assert.deepEqual(changed.map((group) => group.displayedScoreTenths), [84, 83, 82, 81, 80, 79]);
    assertRankingIntegrity(changed);
  });

  it('reserves 10.0 for the top LOVE group and all of its true ties', () => {
    let groups = makeTier('LOVE', 50);
    groups = placeShow(groups, { tmdbId: 100, reaction: 'LOVE', placement: { kind: 'tie', groupId: 1 } }, NOW);
    assert.equal(buildRankings(groups).filter((ranking) => ranking.scoreTenths === 100).length, 2);
    groups = insertAt(groups, 101, 'LOVE', 0);
    assert.equal(memberGroup(groups, 101).displayedScoreTenths, 100);
    assert.equal(memberGroup(groups, 1).displayedScoreTenths, 99);
    assert.equal(buildRankings(groups).filter((ranking) => ranking.scoreTenths === 100).length, 1);
    groups = removeShow(groups, 101, NOW);
    assert.equal(memberGroup(groups, 1).displayedScoreTenths, 100);
    assert.equal(buildRankings(groups).filter((ranking) => ranking.scoreTenths === 100).length, 2);
  });

  it('recomputes a tier after tie-only and same-position updates', () => {
    const groups = makeTier('LIKE', 4);
    groups.forEach((group) => { group.displayedScoreTenths = 84; });
    const tied = placeShow(groups, { tmdbId: 20, reaction: 'LIKE', placement: { kind: 'tie', groupId: 2 } }, NOW);
    assert.deepEqual(tied.map((group) => group.displayedScoreTenths), [84, 83, 82, 81]);
    assert.equal(tied[0].updatedAt, THEN);
    assert.equal(tied[1].updatedAt, NOW);
    const noop = placeShow(groups, { tmdbId: 2, reaction: 'LIKE', placement: { kind: 'insert', index: 1 } }, NOW);
    assert.equal(noop[1].id, 2);
    assert.equal(noop[1].createdAt, THEN);
    assert.deepEqual(noop.map((group) => group.displayedScoreTenths), [84, 83, 82, 81]);
  });

  for (const reaction of REACTION_ORDER) {
    it(`produces identical ${reaction} scores for A, B, C regardless of insertion history`, () => {
      const build = (insertions: readonly [number, number][]) => insertions.reduce(
        (groups, [tmdbId, index]) => insertAt(groups, tmdbId, reaction, index),
        [] as PreferenceGroup[],
      );
      const histories = [
        build([[101, 0], [102, 1], [103, 2]]),
        build([[103, 0], [102, 0], [101, 0]]),
        build([[102, 0], [103, 1], [101, 0]]),
      ];
      const finalRankings = histories.map((groups) => buildRankings(groups).map(({ tmdbId, reaction: tier, scoreTenths, overallRank }) => ({
        tmdbId,
        reaction: tier,
        scoreTenths,
        overallRank,
      })));
      assert.deepEqual(finalRankings[0].map((ranking) => ranking.tmdbId), [101, 102, 103]);
      assert.deepEqual(finalRankings[1], finalRankings[0]);
      assert.deepEqual(finalRankings[2], finalRankings[0]);
    });
  }
});

describe('re-ranking, reaction changes, and removal', () => {
  it('moves a singleton up and down as a new preference group', () => {
    const groups = makeTier('LOVE', 5);
    const up = insertAt(groups, 5, 'LOVE', 0);
    assert.equal(memberGroup(up, 5).sortOrder, 0);
    assert.equal(memberGroup(up, 5).createdAt, NOW);
    assert.equal(memberGroup(up, 5).displayedScoreTenths, 100);
    const down = placeShow(groups, { tmdbId: 1, reaction: 'LOVE', placement: { kind: 'insert', index: 4 } }, NOW);
    assert.equal(memberGroup(down, 1).id, -1);
    assert.equal(memberGroup(down, 1).sortOrder, 4);
    assert.equal(memberGroup(down, 2).displayedScoreTenths, 100);
    assertRankingIntegrity(up);
    assertRankingIntegrity(down);
  });

  it('lets a singleton become tied, and re-ranks one tied member separately', () => {
    const original = makeTier('LOVE', 4);
    const tied = placeShow(original, { tmdbId: 4, reaction: 'LOVE', placement: { kind: 'tie', groupId: 2 } }, NOW);
    assert.equal(tied.length, 3);
    assert.deepEqual(memberGroup(tied, 2).members.map((member) => member.tmdbId), [2, 4]);
    const separated = insertAt(tied, 4, 'LOVE', 0);
    assert.equal(separated.length, 4);
    assert.deepEqual(memberGroup(separated, 2).members.map((member) => member.tmdbId), [2]);
    assert.equal(memberGroup(separated, 2).id, 2);
    assert.equal(memberGroup(separated, 4).displayedScoreTenths, 100);
  });

  it('preserves tie group identity and score when reranking back into the original tie', () => {
    const original = makeTier('LOVE', 3);
    original[1].members.push({ tmdbId: 20, rankedAt: THEN });
    const changed = placeShow(original, { tmdbId: 2, reaction: 'LOVE', placement: { kind: 'tie', groupId: 2 } }, NOW);
    assert.equal(changed[1].id, 2);
    assert.equal(changed[1].displayedScoreTenths, original[1].displayedScoreTenths);
    assert.equal(changed[1].members.find((member) => member.tmdbId === 2)?.rankedAt, NOW);
    assert.equal(changed[1].members.find((member) => member.tmdbId === 20)?.rankedAt, THEN);
  });

  for (const [from, to] of [['LOVE', 'LIKE'], ['MID', 'LOVE']] as const) {
    it(`moves ${from} to ${to} while preserving the untouched tiers`, () => {
      const original = [...makeTier(from, 3), ...makeTier(to, 3, 10), ...makeTier('DISLIKE', 3, 30)];
      const before = structuredClone(original);
      const session = createInsertionSession(original, 2, to);
      assert.deepEqual(original, before); // Reaction selection/cancellation has no side effect.
      const completed = finishAt(session, 1);
      assert.ok(completed.placement);
      const changed = placeShow(original, { tmdbId: 2, reaction: to, placement: completed.placement }, NOW);
      assert.equal(memberGroup(changed, 2).reaction, to);
      assert.equal(memberGroup(changed, 2).sortOrder, 1);
      assert.equal(changed.filter((group) => group.reaction === from).length, 2);
      assert.deepEqual(changed.filter((group) => group.reaction === 'DISLIKE'), original.filter((group) => group.reaction === 'DISLIKE'));
      assert.deepEqual(original, before);
      assertRankingIntegrity(changed);
    });
  }

  it('recomputes both tiers after a reaction change', () => {
    const groups = [...makeTier('LOVE', 3), ...makeTier('LIKE', 3, 10)];
    groups.filter((group) => group.reaction === 'LOVE').forEach((group, index) => { group.displayedScoreTenths = index === 0 ? 100 : 99; });
    groups.filter((group) => group.reaction === 'LIKE').forEach((group) => { group.displayedScoreTenths = 84; });

    const changed = placeShow(groups, { tmdbId: 2, reaction: 'LIKE', placement: { kind: 'insert', index: 1 } }, NOW);

    assert.deepEqual(changed.filter((group) => group.reaction === 'LOVE').map((group) => group.displayedScoreTenths), [100, 99]);
    assert.deepEqual(changed.filter((group) => group.reaction === 'LIKE').map((group) => group.displayedScoreTenths), [84, 83, 82, 81]);
    assertRankingIntegrity(changed);
  });

  it('recomputes the remaining tier after a removal', () => {
    const groups = makeTier('LIKE', 5);
    groups.forEach((group) => { group.displayedScoreTenths = 84; });

    const changed = removeShow(groups, 3, NOW);

    assert.deepEqual(changed.map((group) => group.members[0].tmdbId), [1, 2, 4, 5]);
    assert.deepEqual(changed.map((group) => group.displayedScoreTenths), [84, 83, 82, 81]);
    assertRankingIntegrity(changed);
  });

  it('cleans up empty tiers and compacts ordering when removing singletons', () => {
    const original = [...makeTier('LOVE', 3), ...makeTier('LIKE', 1, 10)];
    const changed = removeShow(removeShow(original, 2, NOW), 10, NOW);
    assert.deepEqual(changed.map((group) => group.sortOrder), [0, 1]);
    assert.ok(changed.every((group) => group.reaction === 'LOVE'));
    assertRankingIntegrity(changed);
    assert.deepEqual(removeShow(makeTier('LOVE', 1), 1, NOW), []);
  });

  it('does not mutate a deeply frozen input during drafts, placement, or removal', () => {
    const groups = makeTier('LOVE', 4);
    for (const group of groups) {
      for (const member of group.members) Object.freeze(member);
      Object.freeze(group.members);
      Object.freeze(group);
    }
    Object.freeze(groups);
    createInsertionSession(groups, 2, 'LOVE');
    placeShow(groups, { tmdbId: 8, reaction: 'LOVE', placement: { kind: 'tie', groupId: 2 } }, NOW);
    placeShow(groups, { tmdbId: 3, reaction: 'LIKE', placement: { kind: 'insert', index: 0 } }, NOW);
    removeShow(groups, 2, NOW);
  });

  it('rejects invalid placement without mutating the original', () => {
    const groups = makeTier('LOVE', 4);
    const original = structuredClone(groups);
    assert.throws(() => placeShow(groups, { tmdbId: 2, reaction: 'LOVE', placement: { kind: 'tie', groupId: 2 } }, NOW));
    assert.throws(() => placeShow(groups, { tmdbId: 2, reaction: 'MID', placement: { kind: 'tie', groupId: 3 } }, NOW));
    assert.throws(() => placeShow(groups, { tmdbId: 2, reaction: 'LOVE', placement: { kind: 'insert', index: 99 } }, NOW));
    assert.deepEqual(groups, original);
  });
});

describe('integrity and long mutation sequences', () => {
  it('rejects duplicate membership, empty groups, gaps, score inversion, and invalid 10.0', () => {
    const valid = makeTier('LOVE', 4);
    const duplicate = structuredClone(valid);
    duplicate[1].members.push({ tmdbId: 1, rankedAt: NOW });
    assert.throws(() => assertRankingIntegrity(duplicate), /only one/);
    const empty = structuredClone(valid);
    empty[0].members = [];
    assert.throws(() => assertRankingIntegrity(empty), /empty/);
    const gap = structuredClone(valid);
    gap[2].sortOrder = 8;
    assert.throws(() => assertRankingIntegrity(gap), /contiguous/);
    const inverted = structuredClone(valid);
    inverted[3].displayedScoreTenths = 99;
    assert.throws(() => assertRankingIntegrity(inverted), /contradict/);
    const ten = structuredClone(valid);
    ten[1].displayedScoreTenths = 100;
    assert.throws(() => assertRankingIntegrity(ten), /top LOVE/);
    const fractional = structuredClone(valid);
    fractional[1].displayedScoreTenths = 99.1;
    assert.throws(() => assertRankingIntegrity(fractional), /band/);
  });

  it('maintains invariants through 500 deterministic inserts, ties, reranks, and removals', () => {
    let groups: PreferenceGroup[] = [];
    let seed = 4;
    let nextId = 1;
    const random = (maximum: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % maximum;
    };
    for (let turn = 0; turn < 500; turn += 1) {
      const rankings = buildRankings(groups);
      const remove = rankings.length > 0 && turn % 7 === 0;
      if (remove) {
        groups = removeShow(groups, rankings[random(rankings.length)].tmdbId, NOW);
      } else {
        const tmdbId = rankings.length > 0 && turn % 3 === 0 ? rankings[random(rankings.length)].tmdbId : nextId++;
        const reaction = REACTION_ORDER[random(REACTION_ORDER.length)];
        let session = createInsertionSession(groups, tmdbId, reaction);
        while (!session.placement) {
          const choice = random(5);
          session = answerComparison(session, choice === 0 ? 'equal' : choice < 3 ? 'candidate' : 'existing');
        }
        groups = persistNewId(placeShow(groups, { tmdbId, reaction, placement: session.placement }, NOW), nextId++);
      }
      assertRankingIntegrity(groups);
      const order = buildRankings(groups);
      for (let index = 1; index < order.length; index += 1) {
        assert.ok(order[index].overallRank >= order[index - 1].overallRank);
        assert.ok(order[index].scoreTenths <= order[index - 1].scoreTenths);
      }
    }
  });
});
