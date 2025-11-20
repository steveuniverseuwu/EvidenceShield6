# Reset Storage Fix - Deployment Instructions

## Problem
The "Reset Storage" feature was not properly deleting audit trail entries, leaving behind audit events for users like:
- Forensics Specialist (Dr. Sarah Johnson)
- Prosecutor (Michael Brown)
- Prosecutor (Jessica Martinez)

## Root Cause
The `getByPrefix()` function in `kv_store.tsx` was only returning **values** but not the **keys**, making it impossible to properly delete entries from the database.

## Solution
Made two key changes:

### 1. Updated `src/supabase/functions/server/kv_store.tsx`
- Modified `getByPrefix()` to include the key in the returned data
- Added new `getKeysByPrefix()` function that returns only keys for efficient deletion

### 2. Updated `src/supabase/functions/server/index.tsx`
- Simplified the reset storage function to use the new `getKeysByPrefix()` 
- Now uses batch deletion (`mdel()`) for better performance
- Properly deletes ALL audit events including `user_audit:*` entries

## Files Changed
1. `src/supabase/functions/server/kv_store.tsx`
2. `src/supabase/functions/server/index.tsx`

## How to Deploy to Supabase

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/functions
2. Find the `make-server-af0976da` function
3. Click "Edit"
4. Copy the contents of both updated files:
   - `src/supabase/functions/server/kv_store.tsx`
   - `src/supabase/functions/server/index.tsx`
5. Update the function code in the dashboard
6. Click "Deploy"

### Option 2: Using Supabase CLI
```bash
cd src
supabase functions deploy make-server-af0976da --project-ref qvxkthmxqsawrdaxukii
```

## Testing
After deployment:
1. Login as admin
2. Click "Reset Storage"
3. Check that ALL audit trails are cleared
4. Verify no orphaned entries remain

## Benefits
- ✅ Properly deletes all audit trail entries
- ✅ More efficient batch deletion
- ✅ Cleaner, more maintainable code
- ✅ No more orphaned data
