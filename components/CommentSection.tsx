import React, { useState } from 'react';
import { CommentData } from '../types';

interface CommentSectionProps {
  postId: string;
  comments: CommentData[];
  onAddComment: (postId: string, commentText: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(postId, newComment);
    setNewComment('');
  };
  
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
    <div className="px-4 pb-4 border-t border-gray-700">
      <div className="max-h-60 overflow-y-auto space-y-3 mt-4 pr-2">
        {comments.map(comment => (
          <div key={comment.id} className="flex items-start space-x-3">
            <img src={comment.user.avatar} alt={comment.user.name} className="h-8 w-8 rounded-full" />
            <div className="bg-gray-700 rounded-xl p-2 px-3 text-sm flex-1">
              <div className="flex items-baseline space-x-2">
                 <span className="font-semibold text-white">{comment.user.name}</span>
                 <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-gray-300">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex space-x-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full bg-gray-700 text-white placeholder-gray-400 p-2 rounded-full border-2 border-transparent focus:border-blue-500 focus:outline-none transition-colors"
        />
        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-500" disabled={!newComment.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default CommentSection;