export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface CommentData {
  id: string;
  user: User;
  text: string;
  created_at: string;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  media?: {
    url: string;
    type: 'image' | 'video';
  };
  created_at: string;
  updated_at?: string;
  likes: number;
  isLiked: boolean;
  comments: CommentData[];
}