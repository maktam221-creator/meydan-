

import React from 'react';
import { Post, User } from '../types';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  onAddPost: (newPostData: Omit<Post, 'id' | 'user' | 'created_at' | 'likes' | 'comments' | 'isLiked'>) => Promise<void>;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onUpdatePost: (postId: string, content: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

const Feed: React.FC<FeedProps> = ({ posts, currentUser, onAddPost, onToggleLike, onAddComment, onUpdatePost, onDeletePost }) => {
  return (
    <div className="space-y-6">
      <CreatePost currentUser={currentUser} onAddPost={onAddPost} />
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onAddComment={onAddComment}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
        />
      ))}
    </div>
  );
};

export default Feed;