import { REACTION_ORDER, REACTIONS } from '../constants/reactions';
import type { PreferenceGroup, RankingInfo } from '../types/ranking';
import { calculateTargetScore, recomputeRankingScores } from './scores';

export function sortPreferenceGroups(groups: readonly PreferenceGroup[]): PreferenceGroup[] {
  return [...groups].sort((a, b) => REACTION_ORDER.indexOf(a.reaction) - REACTION_ORDER.indexOf(b.reaction) || a.sortOrder - b.sortOrder);
}

/** Competition ranks count preceding SHOWS, not score buckets or groups. */
export function buildRankings(groups: readonly PreferenceGroup[]): RankingInfo[] {
  const rankings: RankingInfo[] = [];
  let precedingShows = 0;
  for (const group of recomputeRankingScores(groups)) {
    for (const member of [...group.members].sort((a, b) => a.tmdbId - b.tmdbId)) {
      rankings.push({
        tmdbId: member.tmdbId,
        groupId: group.id,
        reaction: group.reaction,
        scoreTenths: group.displayedScoreTenths,
        overallRank: precedingShows + 1,
        tieSize: group.members.length,
        rankedAt: member.rankedAt,
      });
    }
    precedingShows += group.members.length;
  }
  return rankings;
}

export function assertRankingIntegrity(
  groups: readonly PreferenceGroup[],
  options: { allowHistoricalScores?: boolean } = {},
): void {
  const groupIds = new Set<number>();
  const tmdbIds = new Set<number>();
  for (const group of groups) {
    if (!Number.isSafeInteger(group.id) || groupIds.has(group.id)) throw new Error('Duplicate or invalid preference group ID.');
    groupIds.add(group.id);
    if (!REACTION_ORDER.includes(group.reaction)) throw new Error('Unknown reaction tier.');
    if (group.members.length === 0) throw new Error('An empty preference group cannot be saved.');
    if (!Number.isSafeInteger(group.sortOrder) || group.sortOrder < 0) throw new Error('Invalid preference group order.');
    const { minTenths, maxTenths } = REACTIONS[group.reaction];
    if (!Number.isSafeInteger(group.displayedScoreTenths) || group.displayedScoreTenths < minTenths || group.displayedScoreTenths > maxTenths) {
      throw new Error('A displayed score is outside its reaction band.');
    }
    for (const member of group.members) {
      if (!Number.isSafeInteger(member.tmdbId) || member.tmdbId < 1 || tmdbIds.has(member.tmdbId)) {
        throw new Error('A show can belong to only one preference group.');
      }
      tmdbIds.add(member.tmdbId);
    }
  }
  for (const reaction of REACTION_ORDER) {
    const tier = groups.filter((group) => group.reaction === reaction).sort((a, b) => a.sortOrder - b.sortOrder);
    tier.forEach((group, index) => {
      if (group.sortOrder !== index) throw new Error('Preference group order must be contiguous.');
      if (index > 0 && group.displayedScoreTenths > tier[index - 1].displayedScoreTenths) {
        throw new Error('A score cannot contradict preference order.');
      }
      if (reaction === 'LOVE' && (index === 0 ? group.displayedScoreTenths !== 100 : group.displayedScoreTenths > 99)) {
        throw new Error('Only the top LOVE preference group receives 10.0.');
      }
      if (!options.allowHistoricalScores && group.displayedScoreTenths !== calculateTargetScore(reaction, index, tier.length)) {
        throw new Error('A displayed score must be derived from its current preference position.');
      }
    });
  }
}
