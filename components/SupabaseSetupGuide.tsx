import React from 'react';
import CodeBlock from './CodeBlock';

interface SupabaseSetupGuideProps {
    onComplete: () => void;
}

const sqlScript = `-- This script sets up the database schema for the Meydan social media app.
-- It is idempotent, meaning it can be safely re-run without causing errors.

-- 0. CLEANUP
-- Drop the schema if it exists to ensure a clean slate. This is useful for re-running the script.
DROP SCHEMA IF EXISTS api CASCADE;

-- 1. CREATE API SCHEMA
-- We'll house our application's tables in a dedicated 'api' schema for better organization.
CREATE SCHEMA api;

-- 2. PROFILES TABLE
-- Stores user data, linked to the authentication system.
CREATE TABLE api.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE api.profiles IS 'Stores user profile information.';

-- 3. POSTS TABLE
-- Stores user-created posts.
CREATE TABLE api.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES api.profiles(id) ON DELETE CASCADE,
  content TEXT, -- Content is optional, but post can't be fully empty
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_or_media_present CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);
COMMENT ON TABLE api.posts IS 'Stores all user-generated posts.';

-- 4. LIKES TABLE
-- Tracks likes on posts.
CREATE TABLE api.likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES api.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES api.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
COMMENT ON TABLE api.likes IS 'Tracks user likes on posts.';

-- 5. COMMENTS TABLE
-- Stores comments on posts.
CREATE TABLE api.comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES api.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES api.posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE api.comments IS 'Stores comments made on posts.';

-- 6. TRIGGER FOR UPDATED_AT on POSTS
-- This trigger automatically updates the 'updated_at' column whenever a post is modified.
CREATE OR REPLACE FUNCTION api.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_update
  BEFORE UPDATE ON api.posts
  FOR EACH ROW
  EXECUTE PROCEDURE api.handle_updated_at();
  
-- 7. FUNCTION & TRIGGER FOR AUTO-CREATING PROFILES
-- This function creates a new profile row mirroring the new user in auth.users
CREATE OR REPLACE FUNCTION api.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO api.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email, -- Defaults to email, user can change it later
    'https://api.dicebear.com/8.x/thumbs/svg?seed=' || NEW.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger calls the function after a new user is created in the auth schema
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE api.create_profile_for_new_user();


-- 8. GRANT SCHEMA & TABLE PERMISSIONS
-- Grant usage permission on the 'api' schema to the public roles. This is crucial.
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Grant SELECT permission on all tables in the 'api' schema to anon and authenticated roles.
-- RLS policies will then restrict which rows can be seen.
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon, authenticated;

-- Grant INSERT, UPDATE, DELETE permissions on all tables to the authenticated role.
-- RLS policies will control what actions are allowed on which rows.
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO authenticated;


-- 9. ROW LEVEL SECURITY (RLS) FOR DATABASE TABLES
-- Enable RLS for all tables in the 'api' schema.
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.comments ENABLE ROW LEVEL SECURITY;

-- Policies for PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON api.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON api.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON api.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for POSTS
CREATE POLICY "Posts are viewable by authenticated users." ON api.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create their own posts." ON api.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON api.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts." ON api.posts FOR UPDATE USING (auth.uid() = user_id);

-- Policies for LIKES
CREATE POLICY "Likes are viewable by authenticated users." ON api.likes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own likes." ON api.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON api.likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for COMMENTS
CREATE POLICY "Comments are viewable by authenticated users." ON api.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own comments." ON api.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON api.comments FOR DELETE USING (auth.uid() = user_id);

-- 10. STORAGE BUCKET SETUP
-- Creates the 'media' bucket if it doesn't exist, or updates its settings if it does.
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('media', 'media', true, ARRAY['image/*', 'video/*'], 52428800) -- 50MB limit
ON CONFLICT (id) DO
UPDATE SET
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

COMMENT ON BUCKET media IS 'Stores user-uploaded images and videos.';

-- 11. ROW LEVEL SECURITY FOR STORAGE
-- These policies are applied to the 'media' bucket.

-- Public Read Access for all files in the 'media' bucket.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' );

-- Allow authenticated users to upload files into the 'media' bucket.
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'media' AND auth.uid() IS NOT NULL );

-- Allow users to update their own files from the 'media' bucket.
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'media' AND auth.uid() = owner );

-- Allow users to delete their own files from the 'media' bucket.
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'media' AND auth.uid() = owner );
`;

const edgeFunctionCode = `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenAI } from 'npm:@google/genai'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed for the browser to make a CORS request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, prompt, image } = await req.json();

    // Securely get the Gemini API key from Supabase secrets.
    // @ts-ignore: Deno is a global variable in Supabase Edge Functions
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set in Supabase secrets.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-flash-latest';
    let responseText = '';

    if (type === 'text') {
        const fullPrompt = \`Generate a short, engaging, and cool social media caption. The user is writing about: "\${prompt}". Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.\`;
        const response = await ai.models.generateContent({ model, contents: fullPrompt });
        responseText = response.text;
    } else if (type === 'image' && image) {
        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        };
        const promptText = prompt 
            ? \`Generate a short, engaging, and cool social media caption for this image. The user provided this additional context: "\${prompt}". Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.\`
            : \`Generate a short, engaging, and cool social media caption for this image. Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.\`;
        const textPart = { text: promptText };
        const response = await ai.models.generateContent({ model, contents: { parts: [imagePart, textPart] } });
        responseText = response.text;
    } else {
        throw new Error('Invalid request type or missing image data.');
    }

    return new Response(
      JSON.stringify({ caption: responseText.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in Edge Function:', error.message);
    return new Response(
        JSON.stringify({ error: error.message }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        }
    )
  }
})
`;


const SupabaseSetupGuide: React.FC<SupabaseSetupGuideProps> = ({ onComplete }) => {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-lg shadow-xl border border-blue-500 text-white">
                <h1 className="text-3xl font-bold text-blue-400 mb-4">Meydan Backend Setup</h1>
                <p className="text-lg mb-6 text-gray-300">
                    Welcome! It looks like your Supabase backend needs to be configured. Please follow the steps below to get your backend ready for Meydan.
                </p>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 1: Run SQL Script</h2>
                        <p className="text-gray-400 mb-3">
                            Go to your Supabase project's <span className="font-semibold text-gray-300">SQL Editor</span> and run the entire script below. This will create all necessary tables, the media storage bucket, and configure all database and storage security policies.
                        </p>
                        <CodeBlock code={sqlScript} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 2: Expose 'api' Schema</h2>
                        <p className="text-gray-400 mb-3">
                            For the application to access the tables, you must expose the new <code className="bg-gray-700 px-1 rounded-md">api</code> schema through the API.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                            <li>In your Supabase dashboard, navigate to <span className="font-semibold">API Settings</span> in the sidebar (under the gear icon).</li>
                            <li>Under the <span className="font-semibold">Schema</span> section, add <code className="bg-gray-700 px-2 py-1 rounded-md text-blue-300">api</code> to the list of exposed schemas.</li>
                             <li>Click <span className="font-semibold">Save</span>.</li>
                        </ol>
                    </div>

                     <div>
                        <h2 className="text-xl font-semibold text-white mb-3">Step 3: Deploy AI Caption Function (Crucial for Security)</h2>
                        <p className="text-gray-400 mb-3">
                           To protect your Gemini API key, we will run the AI logic in a secure <span className="font-semibold text-gray-300">Supabase Edge Function</span>. This prevents your secret API key from being exposed in the frontend code. You will need the <a href="https://supabase.com/docs/guides/cli" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase CLI</a> for this step.
                        </p>
                         <ol className="list-decimal list-inside space-y-4 text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                            <li>
                                Create the following file in your project: <br/>
                                <code className="bg-gray-700 px-2 py-1 rounded-md text-blue-300 mt-1 inline-block">supabase/functions/generate-caption/index.ts</code><br/>
                                <span className="text-xs text-gray-400">(You will need to create the 'supabase' and 'functions' directories).</span>
                            </li>
                             <li>
                                Paste the code below into the new <code className="bg-gray-700 px-1 rounded-md">index.ts</code> file.
                             </li>
                        </ol>
                        <div className="mt-4">
                           <CodeBlock code={edgeFunctionCode} />
                        </div>
                        <p className="text-gray-400 mt-4 mb-3">
                           Now, open your terminal in the project's root directory and run these two commands after linking the CLI to your Supabase project:
                        </p>
                         <ol className="list-decimal list-inside space-y-4 text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                            <li>
                                <span className="font-semibold">Set your Gemini API Key as a secret.</span> Replace <code className="bg-gray-700 px-1 rounded-md text-yellow-300">YOUR_GEMINI_KEY</code> with your actual key.
                                <CodeBlock code={'supabase secrets set API_KEY=YOUR_GEMINI_KEY'} />
                            </li>
                            <li>
                                <span className="font-semibold">Deploy the function.</span> The <code className="bg-gray-700 px-1 rounded-md">--no-verify-jwt</code> flag makes the function publicly callable.
                                <CodeBlock code={'supabase functions deploy generate-caption --no-verify-jwt'} />
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                    <h2 className="text-xl font-semibold text-yellow-400 mb-3">Troubleshooting & Final Step</h2>
                    <p className="text-yellow-200/90 mb-3">
                        After completing all steps, please perform a <span className="font-bold text-yellow-300">hard refresh</span> of this page (Cmd+Shift+R or Ctrl+Shift+R). This is crucial to clear the application's cache and load the new database schema.
                    </p>
                </div>


                <div className="mt-8 text-center">
                    <button
                        onClick={onComplete}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        I've completed all steps, take me to the app!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupabaseSetupGuide;