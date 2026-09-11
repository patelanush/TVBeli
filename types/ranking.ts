export type Reaction = 'LOVE' | 'LIKE' | 'MID' | 'DISLIKE';

export type RankingMember = { tmdbId: number; rankedAt: string };
export type PreferenceGroup = {
  id: number;
  reaction: Reaction;
  sortOrder: number;
  displayedScoreTenths: number;
  members: RankingMember[];
  createdAt: string;
  updatedAt: string;
};

export type RankingInfo = {
  tmdbId: number;
  groupId: number;
  reaction: Reaction;
  scoreTenths: number;
  overallRank: number;
  tieSize: number;
  rankedAt: string;
};

export type RankingSnapshot = { revision: number; groups: PreferenceGroup[] };
export type Placement = { kind: 'insert'; index: number } | { kind: 'tie'; groupId: number };
export type ComparisonAnswer = 'candidate' | 'equal' | 'existing';
export type InsertionSession = {
  tmdbId: number;
  reaction: Reaction;
  groups: PreferenceGroup[];
  low: number;
  high: number;
  comparisons: number;
  placement: Placement | null;
};

export type RankingDraft = {
  tmdbId: number;
  reaction: Reaction;
  placement: Placement;
  expectedRevision: number;
};
