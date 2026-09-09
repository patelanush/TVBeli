import { TVShow } from '@/types/show';

const image = (path: string, size = 'w780') => `https://image.tmdb.org/t/p/${size}${path}`;

export const shows: TVShow[] = [
  {
    id: 'severance',
    title: 'Severance',
    year: 2022,
    genres: ['Drama', 'Mystery', 'Sci-Fi'],
    description:
      'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. A mysterious colleague appears outside the office, beginning a journey to discover the truth about their jobs.',
    seasons: 2,
    rating: 9.4,
    posterUrl: image('/lFf6LLrQjYldcZItzOkGmMMigP7.jpg', 'w500'),
    backdropUrl: image('/lFf6LLrQjYldcZItzOkGmMMigP7.jpg'),
    accentColor: '#E45A50',
    status: 'watched',
  },
  {
    id: 'the-bear',
    title: 'The Bear',
    year: 2022,
    genres: ['Drama', 'Comedy'],
    description:
      'A young chef from the fine-dining world returns to Chicago to run his family sandwich shop, where he faces a stubborn kitchen crew, strained relationships, and the weight of rebuilding a legacy.',
    seasons: 4,
    rating: 9.1,
    posterUrl: image('/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg', 'w500'),
    backdropUrl: image('/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg'),
    accentColor: '#2B77B9',
    status: 'watching',
  },
  {
    id: 'succession',
    title: 'Succession',
    year: 2018,
    genres: ['Drama', 'Comedy'],
    description:
      'The Roy family controls one of the biggest media and entertainment companies in the world, but their future changes when their aging patriarch begins to step back.',
    seasons: 4,
    rating: 9.3,
    posterUrl: image('/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg', 'w500'),
    backdropUrl: image('/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg'),
    accentColor: '#C79A57',
    status: 'watched',
  },
  {
    id: 'shogun',
    title: 'Shōgun',
    year: 2024,
    genres: ['Drama', 'History', 'War'],
    description:
      'In Japan at the dawn of a century-defining civil war, Lord Yoshii Toranaga fights for his life as his enemies unite against him and a mysterious European ship is found nearby.',
    seasons: 1,
    rating: 9.0,
    posterUrl: image('/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg', 'w500'),
    backdropUrl: image('/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg'),
    accentColor: '#D04435',
    status: 'watchlist',
  },
  {
    id: 'the-last-of-us',
    title: 'The Last of Us',
    year: 2023,
    genres: ['Drama', 'Adventure'],
    description:
      'Twenty years after modern civilization has been destroyed, a hardened survivor is hired to smuggle a teenage girl out of an oppressive quarantine zone.',
    seasons: 2,
    rating: 8.8,
    posterUrl: image('/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', 'w500'),
    backdropUrl: image('/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg'),
    accentColor: '#847B5A',
    status: 'watching',
  },
  {
    id: 'dark',
    title: 'Dark',
    year: 2017,
    genres: ['Crime', 'Drama', 'Mystery'],
    description:
      'A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery that spans three generations.',
    seasons: 3,
    rating: 9.2,
    posterUrl: image('/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg', 'w500'),
    backdropUrl: image('/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg'),
    accentColor: '#36727A',
    status: 'watched',
  },
  {
    id: 'true-detective',
    title: 'True Detective',
    year: 2014,
    genres: ['Drama', 'Crime', 'Mystery'],
    description:
      'Anthology series in which police investigations unearth the personal and professional secrets of those involved, both within and outside the law.',
    seasons: 4,
    rating: 8.9,
    posterUrl: image('/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg', 'w500'),
    backdropUrl: image('/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg'),
    accentColor: '#80643B',
    status: 'watchlist',
  },
  {
    id: 'arcane',
    title: 'Arcane',
    year: 2021,
    genres: ['Animation', 'Drama', 'Action'],
    description:
      'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.',
    seasons: 2,
    rating: 9.5,
    posterUrl: image('/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg', 'w500'),
    backdropUrl: image('/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg'),
    accentColor: '#7459AB',
    status: 'watched',
  },
  {
    id: 'fallout',
    title: 'Fallout',
    year: 2024,
    genres: ['Sci-Fi', 'Action', 'Drama'],
    description:
      'A sheltered vault dweller is forced to return to the irradiated wasteland her ancestors left behind and is shocked to discover a complex, violent universe waiting for her.',
    seasons: 1,
    rating: 8.6,
    posterUrl: image('/AnsSKR9LuK0T9bAOcPVA3PUvyWj.jpg', 'w500'),
    backdropUrl: image('/AnsSKR9LuK0T9bAOcPVA3PUvyWj.jpg'),
    accentColor: '#E0B235',
    status: 'watchlist',
  },
  {
    id: 'andor',
    title: 'Andor',
    year: 2022,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    description:
      'The story of a rising rebellion against an empire and how people and planets become involved, centered on a thief whose journey turns him into a revolutionary hero.',
    seasons: 2,
    rating: 9.0,
    posterUrl: image('/khZqmwHQicTYoS7Flreb9EddFZC.jpg', 'w500'),
    backdropUrl: image('/khZqmwHQicTYoS7Flreb9EddFZC.jpg'),
    accentColor: '#D07937',
    status: 'watched',
  },
];

export const popularShows = shows.slice(0, 6);
export const recentlyWatched = [shows[0], shows[2], shows[7], shows[9]];
export const topShows = [shows[7], shows[0], shows[2], shows[5], shows[9]];

export function getShow(id?: string) {
  return shows.find((show) => show.id === id);
}
