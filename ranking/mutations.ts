import { REACTION_ORDER } from '../constants/reactions';
import type { Placement, PreferenceGroup, Reaction } from '../types/ranking';
import { assertRankingIntegrity, sortPreferenceGroups } from './order';
import { calculateTargetScore, recalibrateTier } from './scores';

type PlacementInput = { tmdbId: number; reaction: Reaction; placement: Placement };

function cloneGroups(groups: readonly PreferenceGroup[]): PreferenceGroup[] {
  return groups.map((group) => ({ ...group, members: group.members.map((member) => ({ ...member })) }));
}

function finishMutation(original: readonly PreferenceGroup[], draft: PreferenceGroup[], now: string): PreferenceGroup[] {
  const result: PreferenceGroup[] = [];
  for (const reaction of REACTION_ORDER) {
    const tier = draft.filter((group) => group.reaction === reaction).map((group, sortOrder) => ({ ...group, sortOrder }));
    const adjusted = recalibrateTier(tier);

    for (const group of adjusted) {
      const previous = original.find((item) => item.id === group.id);
      const changed = !previous || previous.sortOrder !== group.sortOrder || previous.displayedScoreTenths !== group.displayedScoreTenths
        || JSON.stringify(previous.members) !== JSON.stringify(group.members);
      result.push({ ...group, updatedAt: changed ? now : group.updatedAt });
    }
  }
  assertRankingIntegrity(result);
  return result;
}

/** Pure final placement; storage commits its whole result atomically. */
export function placeShow(groups: readonly PreferenceGroup[], input: PlacementInput, now: string): PreferenceGroup[] {
  assertRankingIntegrity(groups, { allowHistoricalScores: true });
  if (!Number.isSafeInteger(input.tmdbId) || input.tmdbId < 1) throw new Error('Invalid TV show ID.');
  if (!REACTION_ORDER.includes(input.reaction)) throw new Error('Unknown reaction tier.');
  const original = groups.find((group) => group.members.some((member) => member.tmdbId === input.tmdbId));
  const remaining = sortPreferenceGroups(cloneGroups(groups))
    .map((group) => ({ ...group, members: group.members.filter((member) => member.tmdbId !== input.tmdbId) }))
    .filter((group) => group.members.length > 0);
  const tier = remaining.filter((group) => group.reaction === input.reaction);
  const member = { tmdbId: input.tmdbId, rankedAt: now };

  if (input.placement.kind === 'tie') {
    const groupId = input.placement.groupId;
    const destination = tier.find((group) => group.id === groupId);
    if (!destination) throw new Error('That preference group is no longer available.');
    destination.members = [...destination.members, member].sort((a, b) => a.tmdbId - b.tmdbId);
  } else {
    const index = input.placement.index;
    if (!Number.isSafeInteger(index) || index < 0 || index > tier.length) throw new Error('Invalid insertion position.');
    const unchanged = original?.reaction === input.reaction && original.members.length === 1 && original.sortOrder === index;
    const inserted: PreferenceGroup = unchanged
      ? { ...original, members: [member] }
      : {
        id: -1,
        reaction: input.reaction,
        sortOrder: index,
        displayedScoreTenths: calculateTargetScore(input.reaction, index, tier.length + 1),
        members: [member],
        createdAt: now,
        updatedAt: now,
      };
    tier.splice(index, 0, inserted);
  }

  const draft = REACTION_ORDER.flatMap((reaction) => reaction === input.reaction ? tier : remaining.filter((group) => group.reaction === reaction));
  return finishMutation(groups, draft, now);
}

/** Removing one tied member leaves the other members in the same true tie. */
export function removeShow(groups: readonly PreferenceGroup[], tmdbId: number, now: string): PreferenceGroup[] {
  assertRankingIntegrity(groups, { allowHistoricalScores: true });
  const remaining = sortPreferenceGroups(cloneGroups(groups))
    .map((group) => ({ ...group, members: group.members.filter((member) => member.tmdbId !== tmdbId) }))
    .filter((group) => group.members.length > 0);
  return finishMutation(groups, remaining, now);
}
