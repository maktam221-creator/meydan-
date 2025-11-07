
import React, { useState } from 'react';
import { Post, User } from '../types';

// A reusable grid component to display posts, keeping the main component clean.
const PostGrid: React.FC<{ posts: Post[] }> = ({ posts }) => {
    if (posts.length === 0) {
        return <div className="text-center text-gray-400 py-10">No posts to display.</div>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post.id} className="group relative rounded-lg overflow-hidden aspect-square">
              {post.media?.type === 'image' && (
                <img src={post.media.url} alt="Post media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              )}
              {post.media?.type === 'video' && (
                <video src={post.media.url} className="w-full h-full object-cover" muted loop playsInline />
              )}
              {!post.media && (
                 <div className="w-full h-full bg-gray-700 p-4 flex items-center justify-center">
                    <p className="text-gray-300 italic text-center">"{post.content.substring(0, 50)}..."</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center p-4">
                <p className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
    );
};

// Reusable tab button for the profile navigation
const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; count: number }> = ({ label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-base font-semibold transition-colors duration-200 border-b-2 ${
            isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
        }`}
    >
        {label} <span className="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5 ml-1 font-normal">{count}</span>
    </button>
);

interface ProfileProps {
  user: User;
  userPosts: Post[];
  likedPosts: Post[];
}

const Profile: React.FC<ProfileProps> = ({ user, userPosts, likedPosts }) => {
  const [activeTab, setActiveTab] = useState<'my-posts' | 'liked-posts'>('my-posts');
  
  const totalLikesReceived = userPosts.reduce((acc, post) => acc + post.likes, 0);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <img src={user.avatar} alt={user.name} className="h-32 w-32 rounded-full border-4 border-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-white text-center sm:text-left">{user.name}</h1>
            <p className="text-gray-400 text-center sm:text-left mt-1">A passionate creator exploring the world.</p>
            <div className="flex justify-center sm:justify-start space-x-6 mt-4 text-center">
              <div>
                <p className="text-xl font-bold">{userPosts.length}</p>
                <p className="text-gray-400 text-sm">Posts</p>
              </div>
              <div>
                <p className="text-xl font-bold">{totalLikesReceived}</p>
                <p className="text-gray-400 text-sm">Likes</p>
              </div>
              <div>
                <p className="text-xl font-bold">{likedPosts.length}</p>
                <p className="text-gray-400 text-sm">Liked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 px-2">
        <nav className="flex space-x-2">
            <TabButton label="Posts" isActive={activeTab === 'my-posts'} onClick={() => setActiveTab('my-posts')} count={userPosts.length} />
            <TabButton label="Liked" isActive={activeTab === 'liked-posts'} onClick={() => setActiveTab('liked-posts')} count={likedPosts.length} />
        </nav>
      </div>

      <div className="p-6 pt-4">
        {activeTab === 'my-posts' ? (
          <PostGrid posts={userPosts} />
        ) : (
          <PostGrid posts={likedPosts} />
        )}
      </div>
    </div>
  );
};

export default Profile;