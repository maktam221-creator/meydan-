import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's highly recommended to use environment variables for this in a real project.
export const supabaseUrl = 'https://ybvwopgikkeehrdyphdm.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidndvcGdpa2tlZWhyZHlwaGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Njc1MjgsImV4cCI6MjA3ODA0MzUyOH0.FXdcgqlzNSqC3O2dhxSRrKqaFWlzzOEh99mMWqMJ_QI';

// The app will now show a full-screen message if these are not replaced,
// so the console warning is no longer necessary.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);