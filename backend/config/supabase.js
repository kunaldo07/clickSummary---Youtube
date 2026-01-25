/**
 * Supabase Client Configuration
 * Provides both admin (service role) and anon clients
 */

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('⚠️ Missing Supabase credentials in environment variables');
}

// Admin client (for backend operations with service role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anon client (for client-side operations)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('✅ Supabase clients initialized');

module.exports = {
  supabaseAdmin,
  supabaseAnon
};
