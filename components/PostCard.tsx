
import React, { useState } from 'react';
import { Post } from '../types';
import HeartIcon from './icons/HeartIcon';
import CommentIcon from './icons/CommentIcon';
import ShareIcon from './icons/ShareIcon';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onToggleLike, onAddComment }) => {
    const [showComments, setShowComments] = useState(false);
    
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center">
          <img src={post.user.avatar} alt={post.user.name} className="h-10 w-10 rounded-full" />
          <div className="ml-3">
            <p className="font-semibold text-white">{post.user.name}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.timestamp)} ago</p>
          </div>
        </div>
        <p className="text-gray-300 mt-3 whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.media && (
        <div className="bg-black">
          {post.media.type === 'image' ? (
            <img src={post.media.url} alt="Post media" className="w-full max-h-[70vh] object-contain" />
          ) : (
            <video src={post.media.url} controls className="w-full max-h-[70vh]" />
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between text-gray-400 text-sm mb-3">
            <span>{post.likes} Likes</span>
            <span>{post.comments.length} Comments</span>
        </div>
        <div className="border-t border-gray-700 pt-2 flex justify-around">
            <button onClick={() => onToggleLike(post.id)} className={`flex items-center space-x-2 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-700 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`}>
                <HeartIcon className="h-6 w-6" filled={post.isLiked} /> <span>Like</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 text-gray-400 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-700">
                <CommentIcon className="h-6 w-6" /> <span>Comment</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-400 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-700">
                <ShareIcon className="h-6 w-6" /> <span>Share</span>
            </button>
        </div>
      </div>
      
      {showComments && (
        <CommentSection 
            postId={post.id} 
            comments={post.comments} 
            onAddComment={onAddComment}
        />
      )}
    </div>
  );
};

export default PostCard;
