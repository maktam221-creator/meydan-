
import React, { useState, useRef } from 'react';
import { User, Post } from '../types';
import { generatePostCaption } from '../services/geminiService';
import PhotoIcon from './icons/PhotoIcon';
import VideoCameraIcon from './icons/VideoCameraIcon';
import SparklesIcon from './icons/SparklesIcon';

interface CreatePostProps {
  currentUser: User;
  onAddPost: (newPostData: Omit<Post, 'id' | 'user' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onAddPost }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateCaption = async () => {
    if (!content.trim()) {
      alert("Please write something about your post first!");
      return;
    }
    setIsGenerating(true);
    try {
      const caption = await generatePostCaption(content);
      setContent(caption);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    const newPostData: Omit<Post, 'id' | 'user' | 'timestamp' | 'likes' | 'comments' | 'isLiked'> = {
      content: content,
    };

    if (mediaPreview && mediaFile) {
      newPostData.media = {
        url: mediaPreview,
        type: mediaFile.type.startsWith('image') ? 'image' : 'video',
      };
    }

    onAddPost(newPostData);
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <img src={currentUser.avatar} alt="Your avatar" className="h-12 w-12 rounded-full" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser.name}?`}
            className="w-full bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg border-2 border-transparent focus:border-blue-500 focus:bg-gray-800 focus:outline-none transition-all duration-200 resize-none"
            rows={3}
          ></textarea>
        </div>
        
        {mediaPreview && (
          <div className="mt-4 pl-16">
            {mediaFile?.type.startsWith('image') ? (
              <img src={mediaPreview} alt="Preview" className="max-h-80 rounded-lg" />
            ) : (
              <video src={mediaPreview} controls className="max-h-80 rounded-lg" />
            )}
             <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="mt-2 text-sm text-red-400 hover:text-red-300">Remove</button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pl-16">
          <div className="flex space-x-2 text-gray-400">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" id="media-upload" />
            <label htmlFor="media-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-700 hover:text-blue-400 transition-colors">
              <PhotoIcon className="h-6 w-6" />
            </label>
             <button type="button" disabled={!content.trim() || isGenerating} onClick={handleGenerateCaption} className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <SparklesIcon className="h-6 w-6" />
              <span className="text-sm font-semibold">{isGenerating ? 'Generating...' : 'AI Caption'}</span>
            </button>
          </div>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-500" disabled={!content.trim() && !mediaFile}>
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
