/**
 * Supabase Client Configuration for Frontend
 */

import { createClient } from '@supabase/supabase-js';

// Use placeholder values during build time to prevent errors
// The actual values will be used at runtime in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

if (!isBuildTime) {
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase using placeholder config (build time)');
}
