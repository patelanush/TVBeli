import { FriendActivity } from '@/types/show';

export const friendActivity: FriendActivity[] = [
  {
    id: 'activity-1',
    name: 'Alex Chen',
    initials: 'AC',
    avatarColor: '#6750A4',
    action: 'rated Severance',
    showId: 'severance',
    rating: 9.4,
    timeAgo: '12m',
  },
  {
    id: 'activity-2',
    name: 'Sam Rivera',
    initials: 'SR',
    avatarColor: '#C75B39',
    action: 'added The Bear to their watchlist',
    showId: 'the-bear',
    timeAgo: '1h',
  },
  {
    id: 'activity-3',
    name: 'Maya Patel',
    initials: 'MP',
    avatarColor: '#247BA0',
    action: 'finished Arcane',
    showId: 'arcane',
    rating: 9.7,
    timeAgo: '3h',
  },
  {
    id: 'activity-4',
    name: 'Jordan Lee',
    initials: 'JL',
    avatarColor: '#598157',
    action: 'started watching The Last of Us',
    showId: 'the-last-of-us',
    timeAgo: 'Yesterday',
  },
];
