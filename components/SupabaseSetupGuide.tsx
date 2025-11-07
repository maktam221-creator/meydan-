
import React from 'react';
import CodeBlock from './CodeBlock';

interface SupabaseSetupGuideProps {
    onComplete: () => void;
}

const sqlScript = `-- This script sets up the database schema for the Meydan social media app.
-- Run this in your Supabase project's SQL Editor.

-- 1. PROFILES TABLE
-- Stores user data, linked to the authentication system.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information.';

-- 2. POSTS TABLE
-- Stores user-created posts.
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT, -- Content is optional, but post can't be fully empty
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_or_media_present CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);
COMMENT ON TABLE public.posts IS 'Stores all user-generated posts.';

-- 3. LIKES TABLE
-- Tracks likes on posts.
CREATE TABLE public.likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
COMMENT ON TABLE public.likes IS 'Tracks user likes on posts.';

-- 4. COMMENTS TABLE
-- Stores comments on posts.
CREATE TABLE public.comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.comments IS 'Stores comments made on posts.';

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for POSTS
CREATE POLICY "Posts are viewable by authenticated users." ON public.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Policies for LIKES
CREATE POLICY "Likes are viewable by authenticated users." ON public.likes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for COMMENTS
CREATE POLICY "Comments are viewable by authenticated users." ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);
`;

const SupabaseSetupGuide: React.FC<SupabaseSetupGuideProps> = ({ onComplete }) => {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-lg shadow-xl border border-blue-500 text-white">
                <h1 className="text-3xl font-bold text-blue-400 mb-4">Meydan Backend Setup</h1>
                <p className="text-lg mb-6 text-gray-300">
                    Welcome! It looks like your Supabase database needs to be configured. Please follow the steps below to get your backend ready for Meydan.
                </p>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 1: Run SQL Script</h2>
                        <p className="text-gray-400 mb-3">
                            Go to your Supabase project's <span className="font-semibold text-gray-300">SQL Editor</span> and run the entire script below. This will create all the necessary tables and security policies.
                        </p>
                        <CodeBlock code={sqlScript} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 2: Create Storage Bucket</h2>
                        <p className="text-gray-400 mb-3">
                            To handle image and video uploads, you need to create a storage bucket.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                            <li>In your Supabase dashboard, navigate to the <span className="font-semibold">Storage</span> section.</li>
                            <li>Click <span className="font-semibold">Create a new bucket</span>.</li>
                            <li>Name the bucket exactly <code className="bg-gray-700 px-2 py-1 rounded-md text-blue-300">media</code>.</li>
                            <li>Turn <span className="font-semibold">ON</span> the toggle to make it a <span className="font-semibold">Public bucket</span>.</li>
                            <li>Click <span className="font-semibold">Create bucket</span>.</li>
                        </ol>
                    </div>

                     <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 3: Set Storage Policies</h2>
                        <p className="text-gray-400 mb-3">
                            For security, let's ensure only logged-in users can upload files.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                            <li>Go to <span className="font-semibold">Storage</span> &rarr; <span className="font-semibold">Policies</span>.</li>
                            <li>Select the <code className="bg-gray-700 px-1 rounded-md">media</code> bucket and click <span className="font-semibold">New policy</span>.</li>
                            <li>Select <span className="font-semibold">Create a new policy from scratch</span>.</li>
                            <li>For <span className="font-semibold">Policy name</span>, enter <code className="bg-gray-700 px-1 rounded-md">Authenticated users can upload</code>.</li>
                             <li>For <span className="font-semibold">Allowed operations</span>, check <code className="bg-gray-700 px-1 rounded-md">INSERT</code>.</li>
                            <li>For <span className="font-semibold">Target roles</span>, keep <code className="bg-gray-700 px-1 rounded-md">authenticated</code> selected.</li>
                             <li>Leave the <span className="font-semibold">USING expression</span> as is.</li>
                            <li>For the <span className="font-semibold">WITH CHECK expression</span>, enter <code className="bg-gray-700 px-1 rounded-md">auth.uid() IS NOT NULL</code>.</li>
                            <li>Click <span className="font-semibold">Review</span> and then <span className="font-semibold">Save policy</span>.</li>
                        </ol>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                    <h2 className="text-xl font-semibold text-yellow-400 mb-3">Troubleshooting & Final Step</h2>
                    <p className="text-yellow-200/90 mb-3">
                        After running the script and setting up storage, please perform a <span className="font-bold text-yellow-300">hard refresh</span> of this page (Cmd+Shift+R or Ctrl+Shift+R). This is crucial to clear the application's cache and load the new database schema.
                    </p>
                    <p className="text-yellow-200/90">
                        If you still encounter errors (like "column not found"), it may mean your database was partially set up before. The safest solution is to go to your Supabase <span className="font-semibold text-yellow-300">Table Editor</span>, delete the <code className="bg-gray-700 px-1 rounded-md">posts</code>, <code className="bg-gray-700 px-1 rounded-md">likes</code>, <code className="bg-gray-700 px-1 rounded-md">comments</code>, and <code className="bg-gray-700 px-1 rounded-md">profiles</code> tables, and then run the SQL script again.
                    </p>
                </div>


                <div className="mt-8 text-center">
                    <button
                        onClick={onComplete}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        I've completed the setup, take me to the app!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupabaseSetupGuide;
