

import React, { useState, useRef } from 'react';
import { User, Post } from '../types';
import { generateCaptionFromText, generateCaptionFromImage } from '../services/geminiService';
import PhotoIcon from './icons/PhotoIcon';
import SparklesIcon from './icons/SparklesIcon';
import Spinner from './icons/Spinner';
import { supabase } from '../services/supabaseClient';

interface CreatePostProps {
  currentUser: User;
  onAddPost: (newPostData: Omit<Post, 'id' | 'user' | 'created_at' | 'likes' | 'comments' | 'isLiked'>) => Promise<void>;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onAddPost }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setPostError(null);
    }
  };

  const handleGenerateCaption = async () => {
    const isImage = mediaFile?.type.startsWith('image');
    if (!content.trim() && !isImage) {
      alert("Please write something or add an image first!");
      return;
    }
    
    setIsGenerating(true);
    setPostError(null);
    try {
      let caption = '';
      if (isImage) {
        caption = await generateCaptionFromImage(mediaFile, content);
      } else {
        caption = await generateCaptionFromText(content);
      }
      setContent(caption);
    } catch (error: any) {
      console.error(error);
      setPostError(error.message || "Failed to generate caption.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    
    setIsPosting(true);
    setPostError(null);

    try {
        const newPostData: Omit<Post, 'id' | 'user' | 'created_at' | 'likes' | 'comments' | 'isLiked'> = {
            content: content,
        };

        if (mediaFile) {
            const fileExt = mediaFile.name.split('.').pop();
            const filePath = `${currentUser.id}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('media').upload(filePath, mediaFile);

            if (uploadError) {
                throw new Error(`Media upload failed: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
            newPostData.media = {
                url: publicUrl,
                type: mediaFile.type.startsWith('image') ? 'image' : 'video',
            };
        }

        await onAddPost(newPostData);
        
        setContent('');
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    } catch (err: any) {
        let errorMessage = 'An unknown error occurred while posting.';
        if (err && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setPostError(errorMessage);
    } finally {
        setIsPosting(false);
    }
  };

  const isImageUploaded = mediaFile?.type.startsWith('image');
  const canGenerate = (content.trim() || isImageUploaded) && !isGenerating && !isPosting;
  const generateButtonText = isGenerating ? 'Generating...' : (isImageUploaded ? 'Generate from Image' : 'AI Caption');

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <img src={currentUser.avatar} alt="Your avatar" className="h-12 w-12 rounded-full" />
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setPostError(null); }}
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
             <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-2 text-sm text-red-400 hover:text-red-300">Remove</button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pl-16">
          <div className="flex space-x-2 text-gray-400">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" id="media-upload" />
            <label htmlFor="media-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-700 hover:text-blue-400 transition-colors">
              <PhotoIcon className="h-6 w-6" />
            </label>
             <button type="button" disabled={!canGenerate} onClick={handleGenerateCaption} className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? <Spinner className="h-6 w-6"/> : <SparklesIcon className="h-6 w-6" />}
              <span className="text-sm font-semibold pr-2">{generateButtonText}</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={isPosting || (!content.trim() && !mediaFile)}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
          >
            {isPosting ? <Spinner className="h-5 w-5 mr-2" /> : null}
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {postError && (
          <div className="pl-16 mt-3">
            <p className="text-red-400 text-sm">{postError}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;