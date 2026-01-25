# Supabase Migration Steps

## ✅ Completed
- [x] Installed `@supabase/supabase-js` in backend and frontend
- [x] Created Supabase client configuration (`backend/config/supabase.js`)
- [x] Created Supabase auth middleware (`backend/middleware/supabaseAuth.js`)
- [x] Created SupabaseUser model with helper functions (`backend/models/SupabaseUser.js`)
- [x] Created new Supabase auth routes (`backend/routes/supabaseAuth.js`)
- [x] Updated server.js to include Supabase auth routes

## 🔄 Next Steps

### Step 1: Create Database Schema in Supabase (YOU NEED TO DO THIS NOW)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `/Users/kbadole/Documents/projects/youtube-extension-2/backend/supabase-schema.sql`
6. Copy the entire contents and paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

**This will create:**
- ✅ `users` table with subscription & usage tracking
- ✅ `summaries` table for caching
- ✅ `chat_messages` table
- ✅ Row Level Security policies
- ✅ Auto-trigger to create user profiles on signup
- ✅ Helper functions for usage management

### Step 2: Enable Google OAuth in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: (from your current `.env` - `GOOGLE_CLIENT_ID`)
   - **Client Secret**: (from your current `.env` - `GOOGLE_CLIENT_SECRET`)
4. Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`
5. Save

### Step 3: Update Frontend to Use Supabase Auth (NEXT)

After you complete Steps 1 & 2, I'll:
- Update frontend sign-in flow to use Supabase
- Update extensions to use Supabase sessions
- Test the complete authentication flow

## 📊 Migration Progress

**Backend:** 70% Complete
- ✅ Supabase client setup
- ✅ Auth middleware
- ✅ User model helpers
- ✅ Auth routes
- ⏳ Update summarizer routes to use Supabase auth
- ⏳ Update Reddit routes to use Supabase auth

**Frontend:** 0% Complete
- ⏳ Install Supabase client
- ⏳ Update sign-in component
- ⏳ Update auth context
- ⏳ Update API calls

**Extensions:** 0% Complete
- ⏳ Update YouTube extension auth
- ⏳ Update Reddit extension auth
- ⏳ Simplify website-sync.js

## 🎯 Current Status

**Waiting for you to:**
1. Run the SQL schema in Supabase (Step 1 above)
2. Enable Google OAuth in Supabase (Step 2 above)
3. Confirm completion so I can continue with frontend migration

**Once you confirm, I'll continue with the migration automatically.**
