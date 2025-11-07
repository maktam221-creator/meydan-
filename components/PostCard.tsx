import React, { useState, useRef, useEffect } from 'react';
import { Post, User } from '../types';
import HeartIcon from './icons/HeartIcon';
import CommentIcon from './icons/CommentIcon';
import ShareIcon from './icons/ShareIcon';
import CommentSection from './CommentSection';
import MoreHorizontalIcon from './icons/MoreHorizontalIcon';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onUpdatePost: (postId: string, newContent: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onToggleLike, onAddComment, onUpdatePost, onDeletePost }) => {
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);

    const optionsRef = useRef<HTMLDivElement>(null);
    const isOwner = currentUser.id === post.user.id;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
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

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            onDeletePost(post.id);
        }
        setShowOptions(false);
    };

    const handleEdit = () => {
        setEditedContent(post.content);
        setIsEditing(true);
        setShowOptions(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent(post.content);
    };

    const handleSaveEdit = async () => {
        if (editedContent.trim() === post.content) {
            return handleCancelEdit();
        }
        setIsSaving(true);
        await onUpdatePost(post.id, editedContent.trim());
        setIsSaving(false);
        setIsEditing(false);
    };

    const isEdited = post.updated_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 10000;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <img src={post.user.avatar} alt={post.user.name} className="h-10 w-10 rounded-full" />
                <div className="ml-3">
                    <p className="font-semibold text-white">{post.user.name}</p>
                    <p className="text-xs text-gray-400">
                      {timeAgo(post.created_at)} ago
                      {isEdited && <span className="ml-1 font-semibold">&middot; edited</span>}
                    </p>
                </div>
            </div>
            {isOwner && (
                <div className="relative" ref={optionsRef}>
                    <button onClick={() => setShowOptions(!showOptions)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                        <MoreHorizontalIcon className="h-5 w-5" />
                    </button>
                    {showOptions && (
                        <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-lg shadow-xl z-10 py-1 border border-gray-600">
                           <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Edit Post</button>
                           <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Delete Post</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {isEditing ? (
            <div className="mt-3">
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg border-2 border-blue-500 focus:bg-gray-800 focus:outline-none transition-all duration-200 resize-y"
                    rows={4}
                    autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSaveEdit} disabled={isSaving || editedContent.trim() === ''} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        ) : (
             <p className="text-gray-300 mt-3 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {!isEditing && post.media && (
        <div className="bg-black flex justify-center">
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