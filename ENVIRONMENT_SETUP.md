# Environment Setup Guide

## Issue: "Failed to fetch" or "undefined.supabase.co" errors

If you're seeing errors like:
- `Failed to load users: Failed to fetch`
- `undefined.supabase.co/functions/v1/...`
- `ERR_NAME_NOT_RESOLVED`

This means the environment variables are not loaded properly.

## Root Cause

Vite loads environment variables when the development server **starts**. If you:
1. Started the dev server first
2. Then created or modified the `.env` file
3. The server won't automatically pick up the changes

## Solution

### Step 1: Stop the Development Server
In your terminal where the dev server is running, press:
```
Ctrl + C
```

### Step 2: Verify Your .env File
Make sure you have a `.env` file in the root directory with these variables:
```env
VITE_SUPABASE_URL=https://qvxkthmxqsawrdaxukii.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2eGt0aG14cXNhd3JkYXh1a2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMTE4NDUsImV4cCI6MjA3ODU4Nzg0NX0.DS0jwosL3JbzXkuF101tdPgSBbWRoZxzmg9LYtCaihk
VITE_SUPABASE_PROJECT_ID=qvxkthmxqsawrdaxukii
```

### Step 3: Restart the Development Server
```bash
npm run dev
```

### Step 4: Hard Refresh Your Browser
Once the server restarts, go to your browser and do a hard refresh:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

Or clear your browser cache and refresh normally.

## Verification

After following these steps, check your browser console (F12 → Console tab). You should see:
```
🔍 UserTable - Supabase Config Check:
  projectId: qvxkthmxqsawrdaxukii
  publicAnonKey: ✓ Present
  supabaseUrl: https://qvxkthmxqsawrdaxukii.supabase.co
```

If you still see `undefined` values, the `.env` file is not being loaded correctly.

## Common Mistakes

1. ❌ **Wrong file location**: The `.env` file must be in the root directory (same level as `package.json`)
2. ❌ **Wrong file name**: Must be exactly `.env` (not `env.txt` or `.env.local`)
3. ❌ **Server not restarted**: Environment variables are only loaded at startup
4. ❌ **Browser cache**: Old JavaScript might be cached in your browser

## Still Having Issues?

Check the following:
1. Open the browser console (F12) and look for error messages
2. Verify the `.env` file exists: `Test-Path .env` in PowerShell
3. Check the file contents: `Get-Content .env` in PowerShell
4. Make sure no spaces around the `=` sign in the `.env` file
5. Ensure all three variables start with `VITE_` prefix (required by Vite)

## Why Does This Happen?

Vite uses a build-time replacement for environment variables. They are:
- Loaded when the dev server starts
- Replaced in your code during the build process
- Not dynamically read at runtime

This is different from Node.js applications where you can use `process.env` at runtime.
