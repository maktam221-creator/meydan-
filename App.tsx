

import React, { useState, useEffect, useCallback } from 'react';
import { Post, User } from './types';
import Header from './components/Header';
import Feed from './components/Feed';
import Profile from './components/Profile';
import { supabase, supabaseAnonKey } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Spinner from './components/icons/Spinner';
import SupabaseSetupGuide from './components/SupabaseSetupGuide';

type View = 'feed' | 'profile';

const GUEST_USER: User = { id: '', name: 'Guest', avatar: `https://api.dicebear.com/8.x/thumbs/svg?seed=guest` };

const SupabaseInstructions: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-xl border border-yellow-500 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">Configuration Required</h1>
      <p className="text-lg mb-6">
        Welcome to Meydan! One last step to get started: connect the app to your Supabase backend.
      </p>
      <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm">
        <p className="font-sans font-semibold mb-2 text-lg">Please follow these steps:</p>
        <ol className="list-decimal list-inside space-y-3 text-gray-300">
          <li>
            In your project files, open the file:
            <br />
            <code className="bg-gray-700 px-2 py-1 rounded-md text-yellow-300 mt-1 inline-block">services/supabaseClient.ts</code>
          </li>
          <li>
            Replace the placeholder value for <code className="bg-gray-700 px-2 py-1 rounded-md text-yellow-300">supabaseAnonKey</code> with your actual Supabase project anon key.
          </li>
          <li>
            Save the file and this page will automatically update.
          </li>
        </ol>
      </div>
       <p className="mt-6 text-sm text-gray-400">
        You can find your anon Key in your Supabase project's settings under the <span className="font-semibold">API</span> section.
      </p>
    </div>
  </div>
);


const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  const [view, setView] = useState<View>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);


  const fetchAllData = useCallback(async () => {
    // Only show the big spinner on the first load
    if (!posts.length) setLoading(true); 
    setError(null);
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`*`)
            .eq('id', session.user.id)
            .single();

        let userProfileData = profileData;
        if (profileError && profileError.code === 'PGRST116') {
             if (profileError.message.includes('relation "public.profiles" does not exist')) {
                setShowSetupGuide(true);
                setLoading(false);
                return;
            }
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    name: session.user.email?.split('@')[0] || 'New User',
                    avatar_url: `https://api.dicebear.com/8.x/thumbs/svg?seed=${session.user.id}`
                })
                .select()
                .single();

            if (insertError) throw new Error(`Failed to create user profile: ${insertError.message}`);
            userProfileData = newProfile;
        } else if (profileError) {
            throw profileError;
        }
        
        const userProfile = {
            id: session.user.id,
            name: userProfileData?.name || session.user.email || 'New User',
            avatar: userProfileData?.avatar_url || `https://api.dicebear.com/8.x/thumbs/svg?seed=${session.user.id}`,
        };
        setCurrentUser(userProfile);

        const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('*, profiles(*), comments(*, profiles(*))')
            .order('created_at', { ascending: false });
        if (postsError) throw postsError;

        const { data: likesData, error: likesError } = await supabase.from('likes').select('post_id, user_id');
        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.filter(like => like.user_id === session.user.id).map(like => like.post_id));
        const likesCountMap = (likesData || []).reduce((acc, like) => {
            acc[like.post_id] = (acc[like.post_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const formattedPosts: Post[] = postsData.map(post => ({
            id: post.id,
            content: post.content,
            media: post.media_url ? { url: post.media_url, type: post.media_type as 'image' | 'video' } : undefined,
            created_at: post.created_at,
            user: {
                id: post.profiles.id,
                name: post.profiles.name || 'Anonymous',
                avatar: post.profiles.avatar_url || `https://api.dicebear.com/8.x/thumbs/svg?seed=${post.profiles.id}`,
            },
            comments: (post.comments || []).map((c: any) => ({
                id: c.id,
                text: c.text,
                created_at: c.created_at,
                user: {
                    id: c.profiles.id,
                    name: c.profiles.name || 'Anonymous',
                    avatar: c.profiles.avatar_url || `https://api.dicebear.com/8.x/thumbs/svg?seed=${c.profiles.id}`,
                }
            })).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            likes: likesCountMap[post.id] || 0,
            isLiked: likedPostIds.has(post.id),
        }));
        
        setPosts(formattedPosts);
    } catch (err: any) {
        console.error("Error fetching data:", err);
        // Check for common setup error: missing table
        if (err.message && (err.message.includes('relation') && err.message.includes('does not exist'))) {
            setShowSetupGuide(true);
        } else {
            setError(`Failed to load data: ${err.message}`);
        }
    } finally {
        setLoading(false);
    }
  }, [session.user.id, posts.length]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase.channel('meydan-feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAllData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  const handleAddPost = async (newPostData: Omit<Post, 'id' | 'user' | 'created_at' | 'likes' | 'comments' | 'isLiked'>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: newPostData.content,
          media_url: newPostData.media?.url,
          media_type: newPostData.media?.type,
        });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error creating post object:", err);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err) {
        if (typeof err.message === 'string' && err.message.trim() !== '') {
          errorMessage = err.message;
        } else if (typeof err === 'string' && err.trim() !== '') {
          errorMessage = err;
        } else {
            try {
                const errString = JSON.stringify(err);
                if (errString !== '{}') {
                    errorMessage = errString;
                }
            } catch {
                // Could be a circular reference, ignore.
            }
        }
      }
      
      setError(`Error creating post: ${errorMessage}`);
      // Re-throw the original error so the UI component can handle it locally
      throw err;
    }
  };
  
  const handleToggleLike = async (postId: string) => {
    const originalPosts = posts;
    setPosts(posts.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    try {
      const { data: existingLike } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', session.user.id).single();
      if (existingLike) {
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: session.user.id });
      }
    } catch (err: any) {
      console.error("Error toggling like:", err);
      setError(`Failed to update like: ${err.message}`);
      setPosts(originalPosts);
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    try {
      const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: session.user.id, text: commentText });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error adding comment:", err);
      setError(`Failed to add comment: ${err.message}`);
    }
  };
  
  const handleSetupComplete = () => {
    setShowSetupGuide(false);
    fetchAllData();
  };

  if (showSetupGuide) {
    return <SupabaseSetupGuide onComplete={handleSetupComplete} />;
  }

  const userPosts = posts.filter(p => p.user.id === currentUser.id);
  const likedPosts = posts.filter(p => p.isLiked);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-10 w-10 text-blue-500" /></div>;
  }

  return (
    <>
      <Header setView={setView} currentView={view} userAvatar={currentUser.avatar} />
      <main className="max-w-4xl mx-auto pt-20 pb-10 px-4">
        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                    <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            </div>
        )}
        {view === 'feed' ? (
          <Feed posts={posts} currentUser={currentUser} onAddPost={handleAddPost} onToggleLike={handleToggleLike} onAddComment={handleAddComment} />
        ) : (
          <Profile user={currentUser} userPosts={userPosts} likedPosts={likedPosts} />
        )}
      </main>
    </>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if the anon key is still the placeholder
  if (supabaseAnonKey.startsWith('ey')) {
    return session ? <MainApp session={session} /> : <Auth />;
  }

  // If the key is a placeholder, show instructions
  return <SupabaseInstructions />;
};

export default App;