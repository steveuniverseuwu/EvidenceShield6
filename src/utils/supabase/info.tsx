/* Supabase Configuration - Loaded from environment variables */

// Load Supabase configuration from environment variables
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Validation and helpful error messages
if (!projectId || !publicAnonKey || !supabaseUrl) {
  console.error('❌ SUPABASE CONFIGURATION ERROR ❌');
  console.error('One or more required environment variables are missing:');
  console.error('  VITE_SUPABASE_PROJECT_ID:', projectId || '❌ MISSING');
  console.error('  VITE_SUPABASE_ANON_KEY:', publicAnonKey ? '✓' : '❌ MISSING');
  console.error('  VITE_SUPABASE_URL:', supabaseUrl || '❌ MISSING');
  console.error('');
  console.error('📋 TO FIX THIS:');
  console.error('1. Make sure you have a .env file in the root directory');
  console.error('2. Ensure the .env file contains all three variables');
  console.error('3. RESTART your development server (stop and run "npm run dev" again)');
  console.error('4. Clear your browser cache or do a hard refresh (Ctrl+Shift+R)');
  console.error('');
  console.error('⚠️  The application will not work until this is fixed!');
}