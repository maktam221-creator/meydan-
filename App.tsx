

import React, { useState, useEffect, useCallback } from 'react';
import { Post, User } from './types';
import Header from './components/Header';
import Feed from './components/Feed';
import Profile from './components/Profile';
import { supabase, supabaseUrl, supabaseAnonKey } from './services/supabaseClient';
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
            Replace the placeholder values for <code className="bg-gray-700 px-2 py-1 rounded-md text-yellow-300">supabaseUrl</code> and <code className="bg-gray-700 px-2 py-1 rounded-md text-yellow-300">supabaseAnonKey</code> with your actual Supabase project credentials.
          </li>
          <li>
            Save the file. The application should update automatically once the correct values are provided.
          </li>
        </ol>
      </div>
       <p className="mt-6 text-sm text-gray-400">
        You can find your URL and anon Key in your Supabase project's settings under the <span className="font-semibold">API</span> section.
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
        // Fetch profile without .single() to gracefully handle cases where the profile doesn't exist yet (e.g., for legacy users).
        let { data: profileList, error: profileQueryError } = await supabase
            .from('profiles')
            .select(`*`)
            .eq('id', session.user.id)
            .limit(1);

        if (profileQueryError) {
            // If the table doesn't exist, show the setup guide.
            if (profileQueryError.message.includes('relation "api.profiles" does not exist')) {
                setShowSetupGuide(true);
                setLoading(false);
                return;
            }
            // For other errors, we throw them to be caught by the main catch block.
            throw profileQueryError;
        }

        let userProfileData = profileList?.[0];

        // If the profile wasn't found, create it on-the-fly. This handles users created before the auto-creation trigger was in place.
        if (!userProfileData) {
            console.warn("User profile not found. Attempting to create one for a legacy user.");
            const { error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    name: session.user.email, // Default name to email
                    avatar_url: `https://api.dicebear.com/8.x/thumbs/svg?seed=${session.user.id}`
                });
            
            // This handles a race condition where another client creates the profile between our SELECT and INSERT.
            // If the insert fails because it already exists (duplicate key), the subsequent SELECT will find it.
            if (createError && createError.code !== '23505') { // 23505 is unique_violation for duplicate key
                throw createError;
            }

            // Refetch the profile data to get the definitive record.
            const { data: refetchedProfileList, error: refetchError } = await supabase
                .from('profiles').select('*').eq('id', session.user.id).limit(1);
            
            if (refetchError) throw refetchError;

            userProfileData = refetchedProfileList?.[0];
            
            if (!userProfileData) {
                // If it's still not there, something is seriously wrong.
                throw new Error("Fatal: Could not find or create a user profile.");
            }
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
            updated_at: post.updated_at,
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
        console.error("Error fetching data:", err.message || JSON.stringify(err));
        
        let errorMessage = "An unexpected error occurred while fetching data.";
        if (err && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        // Check for common setup errors and guide user back to setup
        if (
            (errorMessage.includes('relation') && errorMessage.includes('does not exist')) || 
            errorMessage.includes('schema "api" is not exposed') ||
            errorMessage.includes('schema must be one of the following') ||
            errorMessage.includes('permission denied for schema api')
        ) {
            setShowSetupGuide(true);
        } else {
            setError(`Failed to load data: ${errorMessage}`);
        }
    } finally {
        setLoading(false);
    }
  }, [session.user.id, session.user.email, posts.length]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase.channel('meydan-feed-changes')
      .on('postgres_changes', { event: '*', schema: 'api' }, () => {
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
      console.error("Error creating post:", err.message || JSON.stringify(err));
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err && typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(`Error creating post: ${errorMessage}`);
      throw err;
    }
  };
  
  const handleToggleLike = async (postId: string) => {
    const originalPosts = posts;
    setPosts(posts.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    try {
      const { data: existingLike, error } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', session.user.id).maybeSingle();
      
      if(error) throw error;

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
  
  const handleUpdatePost = async (postId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: newContent })
        .eq('id', postId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Error updating post:", err);
      setError(`Failed to update post: ${err.message}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const originalPosts = [...posts];
    setPosts(posts.filter(p => p.id !== postId)); // Optimistic delete
    try {
      const postToDelete = originalPosts.find(p => p.id === postId);
      if (!postToDelete) throw new Error("Post not found.");

      if (postToDelete.media?.url) {
        const filePath = new URL(postToDelete.media.url).pathname.split('/media/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage.from('media').remove([filePath]);
          if (storageError) {
            console.error("Could not delete media file, but proceeding with post deletion:", storageError.message);
          }
        }
      }

      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Error deleting post:", err);
      setError(`Failed to delete post: ${err.message}`);
      setPosts(originalPosts); // Rollback on error
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
          <Feed 
            posts={posts} 
            currentUser={currentUser} 
            onAddPost={handleAddPost} 
            onToggleLike={handleToggleLike} 
            onAddComment={handleAddComment}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
          />
        ) : (
          <Profile user={currentUser} userPosts={userPosts} likedPosts={likedPosts} />
        )}
      </main>
    </>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  // Fix: Cast to string to prevent TypeScript error when credentials are provided.
  const isConfigured = (supabaseUrl as string) !== 'YOUR_SUPABASE_URL' && (supabaseAnonKey as string) !== 'YOUR_SUPABASE_ANON_KEY';

  useEffect(() => {
    if (isConfigured) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }
  }, [isConfigured]);
  
  if (!isConfigured) {
    return <SupabaseInstructions />;
  }

  return session ? <MainApp session={session} /> : <Auth />;
};

export default App;
