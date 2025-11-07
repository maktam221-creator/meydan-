import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's highly recommended to use environment variables for this in a real project.
export const supabaseUrl = 'https://ybvwopgikkeehrdyphdm.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidndvcGdpa2tlZWhyZHlwaGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Njc1MjgsImV4cCI6MjA3ODA0MzUyOH0.FXdcgqlzNSqC3O2dhxSRrKqaFWlzzOEh99mMWqMJ_QI';

// Fix: Cast to string to prevent TypeScript error when credentials are provided.
const isConfigured = (supabaseUrl as string) !== 'YOUR_SUPABASE_URL' && (supabaseAnonKey as string) !== 'YOUR_SUPABASE_ANON_KEY';

// We only initialize the client if the credentials have been provided.
// Otherwise, we export a dummy object. The UI is responsible for blocking
// any calls to Supabase until the app is configured, so this object
// will not be used for any actual operations in an unconfigured state.
// This prevents the app from crashing on startup.
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'api',
      },
    })
  : ({} as SupabaseClient);
