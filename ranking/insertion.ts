import type { ComparisonAnswer, InsertionSession, PreferenceGroup, Reaction } from '../types/ranking';

/** A comparison draft never removes the candidate from persistent storage. */
export function createInsertionSession(
  groups: readonly PreferenceGroup[],
  tmdbId: number,
  reaction: Reaction,
): InsertionSession {
  const remaining = groups
    .filter((group) => group.reaction === reaction)
    .map((group) => ({
      ...group,
      members: group.members.filter((member) => member.tmdbId !== tmdbId).map((member) => ({ ...member })),
    }))
    .filter((group) => group.members.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group, sortOrder) => ({ ...group, sortOrder }));

  return {
    tmdbId,
    reaction,
    groups: remaining,
    low: 0,
    high: remaining.length,
    comparisons: 0,
    placement: remaining.length === 0 ? { kind: 'insert', index: 0 } : null,
  };
}

export function getComparisonGroup(session: InsertionSession): PreferenceGroup | null {
  if (session.placement || session.low >= session.high) return null;
  return session.groups[Math.floor((session.low + session.high) / 2)] ?? null;
}

/** Search [low, high); Equal joins a whole preference group immediately. */
export function answerComparison(session: InsertionSession, answer: ComparisonAnswer): InsertionSession {
  const group = getComparisonGroup(session);
  if (!group) throw new Error('This comparison session is already complete.');
  if (answer !== 'candidate' && answer !== 'equal' && answer !== 'existing') {
    throw new Error('Unknown comparison answer.');
  }

  const middle = Math.floor((session.low + session.high) / 2);
  const next = { ...session, comparisons: session.comparisons + 1 };
  if (answer === 'equal') {
    return { ...next, placement: { kind: 'tie', groupId: group.id } };
  }
  if (answer === 'candidate') next.high = middle;
  else next.low = middle + 1;

  if (next.low === next.high) next.placement = { kind: 'insert', index: next.low };
  return next;
}
