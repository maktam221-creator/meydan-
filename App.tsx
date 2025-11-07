
import React, { useState, useCallback } from 'react';
import { Post, User, CommentData } from './types';
import Header from './components/Header';
import Feed from './components/Feed';
import Profile from './components/Profile';
import { MOCK_POSTS, MOCK_USERS } from './data/mockData';

type View = 'feed' | 'profile';

const App: React.FC = () => {
  const [view, setView] = useState<View>('feed');
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  
  // For simplicity, we'll hardcode the current user. In a real app, this would come from an auth context.
  const [currentUser] = useState<User>(MOCK_USERS[0]);

  const addPost = useCallback((newPostData: Omit<Post, 'id' | 'user' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      user: currentUser,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      comments: [],
      ...newPostData,
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  }, [currentUser]);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const likes = isLiked ? post.likes + 1 : post.likes - 1;
          return { ...post, isLiked, likes };
        }
        return post;
      })
    );
  }, []);

  const addComment = useCallback((postId: string, commentText: string) => {
    const newComment: CommentData = {
      id: `c${Date.now()}`,
      user: currentUser,
      text: commentText,
      timestamp: new Date().toISOString(),
    };
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
      })
    );
  }, [currentUser]);

  const userPosts = posts.filter(post => post.user.id === currentUser.id);

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header setView={setView} currentView={view} userAvatar={currentUser.avatar} />
      <main className="max-w-4xl mx-auto pt-20 pb-10 px-4">
        {view === 'feed' ? (
          <Feed
            posts={posts}
            currentUser={currentUser}
            onAddPost={addPost}
            onToggleLike={toggleLike}
            onAddComment={addComment}
          />
        ) : (
          <Profile user={currentUser} posts={userPosts} />
        )}
      </main>
    </div>
  );
};

export default App;
