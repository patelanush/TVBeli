import type { Reaction } from '../types/ranking';

export const REACTION_ORDER: readonly Reaction[] = ['LOVE', 'LIKE', 'MID', 'DISLIKE'];

export const REACTIONS: Record<Reaction, {
  label: string;
  shortLabel: string;
  emoji: string;
  minTenths: number;
  maxTenths: number;
  color: string;
}> = {
  LOVE: { label: 'Loved it', shortLabel: 'Loved', emoji: '❤️', minTenths: 85, maxTenths: 100, color: '#FF6B8A' },
  LIKE: { label: 'Liked it', shortLabel: 'Liked', emoji: '👍', minTenths: 70, maxTenths: 84, color: '#D7FF45' },
  MID: { label: 'Mid', shortLabel: 'Mid', emoji: '😐', minTenths: 50, maxTenths: 69, color: '#A78BFA' },
  DISLIKE: { label: 'Didn’t like it', shortLabel: 'Disliked', emoji: '👎', minTenths: 10, maxTenths: 49, color: '#65B8FF' },
};
