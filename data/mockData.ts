
import { User, Post } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Yousef Ahmed', avatar: 'https://picsum.photos/seed/yousef/200' },
  { id: 'u2', name: 'Fatima Ali', avatar: 'https://picsum.photos/seed/fatima/200' },
  { id: 'u3', name: 'Khalid Omar', avatar: 'https://picsum.photos/seed/khalid/200' },
  { id: 'u4', name: 'Noura Salim', avatar: 'https://picsum.photos/seed/noura/200' },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    user: MOCK_USERS[1],
    content: 'Beautiful sunset at the beach today! 🌅 #sunset #beachlife #nature',
    media: { url: 'https://picsum.photos/seed/sunset/800/600', type: 'image' },
    timestamp: '2024-07-31T18:30:00Z',
    likes: 152,
    isLiked: false,
    comments: [
      { id: 'c1', user: MOCK_USERS[0], text: 'Wow, amazing shot!', timestamp: '2024-07-31T18:35:00Z' },
      { id: 'c2', user: MOCK_USERS[2], text: 'Stunning colors!', timestamp: '2024-07-31T18:40:00Z' },
    ],
  },
  {
    id: 'p2',
    user: MOCK_USERS[2],
    content: 'Just exploring the city streets. So much history here.',
    timestamp: '2024-07-31T15:10:00Z',
    likes: 89,
    isLiked: true,
    comments: [
        { id: 'c3', user: MOCK_USERS[3], text: 'Love that place!', timestamp: '2024-07-31T15:15:00Z' },
    ],
  },
  {
    id: 'p3',
    user: MOCK_USERS[3],
    content: 'A quick tour of my new drone\'s capabilities!',
    media: { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'video' },
    timestamp: '2024-07-30T20:00:00Z',
    likes: 230,
    isLiked: false,
    comments: [
        { id: 'c4', user: MOCK_USERS[1], text: 'The video quality is incredible!', timestamp: '2024-07-30T20:05:00Z' },
    ],
  },
   {
    id: 'p4',
    user: MOCK_USERS[0],
    content: 'My workspace for today. Feeling productive! 💻☕️ #workfromhome #developerlife',
    media: { url: 'https://picsum.photos/seed/workspace/800/500', type: 'image' },
    timestamp: '2024-07-30T10:00:00Z',
    likes: 110,
    isLiked: true,
    comments: [],
  },
];
