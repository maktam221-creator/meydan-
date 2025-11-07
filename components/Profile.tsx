
import React from 'react';
import { Post, User } from '../types';

interface ProfileProps {
  user: User;
  posts: Post[];
}

const Profile: React.FC<ProfileProps> = ({ user, posts }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
        <img src={user.avatar} alt={user.name} className="h-32 w-32 rounded-full border-4 border-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-white text-center sm:text-left">{user.name}</h1>
          <p className="text-gray-400 text-center sm:text-left">A passionate creator exploring the world.</p>
          <div className="flex justify-center sm:justify-start space-x-6 mt-4 text-center">
            <div>
              <p className="text-xl font-bold">{posts.length}</p>
              <p className="text-gray-400 text-sm">Posts</p>
            </div>
            <div>
              <p className="text-xl font-bold">1.2k</p>
              <p className="text-gray-400 text-sm">Followers</p>
            </div>
            <div>
              <p className="text-xl font-bold">340</p>
              <p className="text-gray-400 text-sm">Following</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">My Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post.id} className="group relative rounded-lg overflow-hidden aspect-square">
              {post.media?.type === 'image' && (
                <img src={post.media.url} alt="Post media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              )}
              {post.media?.type === 'video' && (
                <video src={post.media.url} className="w-full h-full object-cover" />
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
      </div>
    </div>
  );
};

export default Profile;
