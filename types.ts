
export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface CommentData {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  media?: {
    url: string;
    type: 'image' | 'video';
  };
  timestamp: string;
  likes: number;
  isLiked: boolean;
  comments: CommentData[];
}
