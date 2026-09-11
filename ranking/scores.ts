import { REACTION_ORDER, REACTIONS } from '../constants/reactions';
import type { PreferenceGroup, Reaction } from '../types/ranking';

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

/** All score arithmetic uses integer tenths, including half-up rounding. */
export function calculateTargetScore(reaction: Reaction, index: number, groupCount: number): number {
  if (!Number.isSafeInteger(groupCount) || groupCount < 1 || !Number.isSafeInteger(index) || index < 0 || index >= groupCount) {
    throw new Error('A target score requires a valid group position.');
  }
  const { minTenths, maxTenths } = REACTIONS[reaction];
  const steps = Math.min(maxTenths - minTenths, groupCount - 1);
  const denominator = Math.max(groupCount - 1, 1);
  const roundedStep = Math.floor((2 * index * steps + denominator) / (2 * denominator));
  const target = clamp(maxTenths - roundedStep, minTenths, maxTenths);
  return reaction === 'LOVE' && index > 0 ? Math.min(target, 99) : target;
}

/** Scores depend only on a group's current position and the size of its tier. */
export function recalibrateTier(groups: readonly PreferenceGroup[]): PreferenceGroup[] {
  if (groups.length === 0) return [];
  const ordered = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const reaction = ordered[0].reaction;
  if (ordered.some((group) => group.reaction !== reaction)) {
    throw new Error('Recalibration requires exactly one reaction tier.');
  }
  return ordered.map((group, index) => ({
    ...group,
    displayedScoreTenths: calculateTargetScore(reaction, index, ordered.length),
  }));
}

/** Canonicalize every reaction tier without mutating the source groups. */
export function recomputeRankingScores(groups: readonly PreferenceGroup[]): PreferenceGroup[] {
  return REACTION_ORDER.flatMap((reaction) => recalibrateTier(groups.filter((group) => group.reaction === reaction)));
}
