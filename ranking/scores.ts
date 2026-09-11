import { REACTIONS } from '../constants/reactions';
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

/**
 * Recalibrate once after a structural tier change, never during reads or drafts.
 * New groups yield to sticky neighbors when their exact target would contradict
 * preference order. Identical scores do not create preference ties.
 */
export function recalibrateTier(
  groups: readonly PreferenceGroup[],
  newGroupIds: ReadonlySet<number> = new Set(),
): PreferenceGroup[] {
  if (groups.length === 0) return [];
  const ordered = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const reaction = ordered[0].reaction;
  if (ordered.some((group) => group.reaction !== reaction)) {
    throw new Error('Recalibration requires exactly one reaction tier.');
  }
  const { minTenths, maxTenths } = REACTIONS[reaction];
  const result = ordered.map((group, index) => {
    const target = calculateTargetScore(reaction, index, ordered.length);
    const delta = target - group.displayedScoreTenths;
    let score = newGroupIds.has(group.id)
      ? target
      : group.displayedScoreTenths + (Math.abs(delta) >= 2 ? Math.sign(delta) : 0);
    score = clamp(score, minTenths, maxTenths);
    if (reaction === 'LOVE') score = index === 0 ? 100 : Math.min(score, 99);
    return { ...group, displayedScoreTenths: score };
  });

  // In normal mutations there is at most one new group. Resolve contiguous new
  // groups too, using the nearest surviving neighbors as sticky boundaries.
  result.forEach((group, index) => {
    if (!newGroupIds.has(group.id)) return;
    let nextExisting = index + 1;
    while (nextExisting < result.length && newGroupIds.has(result[nextExisting].id)) nextExisting += 1;
    const upper = index === 0 ? maxTenths : result[index - 1].displayedScoreTenths;
    const lower = result[nextExisting]?.displayedScoreTenths ?? minTenths;
    group.displayedScoreTenths = clamp(group.displayedScoreTenths, lower, upper);
  });

  // Defensive final guard. Valid sticky survivors already preserve this order.
  result.forEach((group, index) => {
    if (index > 0) group.displayedScoreTenths = Math.min(group.displayedScoreTenths, result[index - 1].displayedScoreTenths);
    if (reaction === 'LOVE') group.displayedScoreTenths = index === 0 ? 100 : Math.min(group.displayedScoreTenths, 99);
  });
  return result;
}
