# Supabase Migration - Setup Instructions

## ✅ Completed Backend Setup

1. ✅ Installed `@supabase/supabase-js` in backend and frontend
2. ✅ Created Supabase client configuration
3. ✅ Created Supabase auth middleware
4. ✅ Created SupabaseUser model with helper functions
5. ✅ Created Supabase auth routes
6. ✅ Updated summarizer routes to support dual auth (MongoDB + Supabase)
7. ✅ Created database schema in Supabase
8. ✅ Enabled Google OAuth in Supabase

## 🔧 Frontend Setup Required

### Step 1: Add Supabase Environment Variables

Create `/Users/kbadole/Documents/projects/youtube-extension-2/frontend/.env.local`:

```bash
# Copy your Supabase credentials from backend/.env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Get these values from your backend `.env` file:**
- `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Update Frontend Sign-In Component

I need to update your frontend sign-in component to use Supabase. 

**Where is your sign-in component located?**
Common locations:
- `/frontend/src/components/SignIn.js`
- `/frontend/src/components/Auth/SignIn.js`
- `/frontend/src/app/signin/page.js`

### Step 3: Update Extensions

After frontend is done, I'll update:
- YouTube extension to use Supabase sessions
- Reddit extension to use Supabase sessions
- Simplify website-sync.js (Supabase handles sync automatically)

## 🧪 Testing Plan

Once everything is migrated:

1. **Test Sign-In Flow**
   - Sign in on frontend with Google
   - Verify Supabase session is created
   - Check localStorage for session token

2. **Test Backend API**
   - Call `/api/supabase-auth/me` to verify session
   - Call `/api/summarizer/summarize` to test dual auth

3. **Test Extensions**
   - YouTube extension should work with Supabase session
   - Reddit extension should work with Supabase session

## 📊 Migration Status

**Backend:** 85% Complete ✅
- ✅ Supabase client and auth middleware
- ✅ Database schema created
- ✅ Dual auth support (MongoDB + Supabase)
- ⏳ Need to update remaining routes (chat, usage, etc.)

**Frontend:** 10% Complete
- ✅ Supabase client created
- ⏳ Need to update sign-in component
- ⏳ Need to update auth context
- ⏳ Need to add environment variables

**Extensions:** 0% Complete
- ⏳ Update YouTube extension
- ⏳ Update Reddit extension
- ⏳ Update website-sync.js

## 🎯 Next Actions

**YOU NEED TO DO:**
1. Create `frontend/.env.local` with Supabase credentials
2. Tell me where your sign-in component is located
3. Restart frontend dev server after adding env variables

**THEN I'LL:**
1. Update sign-in component to use Supabase OAuth
2. Update auth context
3. Update extensions
4. Test everything

---

**Ready to continue? Please:**
1. Add the environment variables to `frontend/.env.local`
2. Tell me the path to your sign-in component
