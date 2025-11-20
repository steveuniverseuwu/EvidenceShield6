# Deploy Batch Upload Duplicate Fix - Manual Steps

## What Was Fixed
The audit trail was showing duplicate entries when uploading batch files:
- **Before**: 1 batch with 2 files = 3 audit entries (2 individual + 1 batch)
- **After**: 1 batch with 2 files = 1 audit entry (only the batch entry)

## Root Cause
The `get-audit-trail` endpoint was fetching both:
- `audit:audit_{id}` (main audit entries)
- `file_audit:{fileId}:audit_{id}` (duplicate references)

Since both start with "audit", they were both returned by the prefix search.

## The Fix
Added a filter in `src/supabase/functions/server/index.tsx` (lines 674-677) to exclude `file_audit:` references.

## Deploy the Fix

### Option 1: Using Supabase CLI (Recommended)

1. Open PowerShell in the project directory
2. Run these commands:

```powershell
# Deploy the server function
supabase functions deploy make-server-af0976da --no-verify-jwt
```

### Option 2: Manual Deployment via Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/functions
2. Click on the `make-server-af0976da` function
3. Click "Edit" or "Update"
4. Copy the entire contents of `src/supabase/functions/server/index.tsx`
5. Paste it into the editor
6. Click "Save" or "Deploy"

### Option 3: Use the Manual Upload

1. Zip the server folder:
   - Right-click on `src/supabase/functions/server/`
   - Select "Send to" > "Compressed (zipped) folder"
2. Upload via Supabase dashboard

## Verify the Fix

After deployment:

1. **Clear any existing test data** (optional):
   - Go to Audit Trail
   - Note existing entries
   
2. **Test the fix**:
   - Go to "Upload Evidence"
   - Select 2 files
   - Enter Case Number and Description
   - Click "Upload Evidence"
   - Wait for upload to complete

3. **Check Audit Trail**:
   - Go to "Audit Trail" page
   - Click the "Refresh" button
   - **Expected**: You should see only 1 "Batch Upload (Merkle Tree)" entry
   - **Fixed**: No duplicate individual file entries

4. **Verify Files Still Work**:
   - Go to "My Evidence"
   - Both files should be listed individually
   - You can download and verify each file

## Technical Details

### Changed File
- `src/supabase/functions/server/index.tsx`

### Change Location
Line 670-677 in the `get-audit-trail` endpoint:

```typescript
// Get all entries with "audit:" prefix
let audits = await kv.getByPrefix("audit:");

// IMPORTANT: Filter out file_audit references (they're duplicates)
// Only keep main audit entries (audit:{id})
audits = audits.filter((audit: any) => {
  const key = audit.key || audit._key;
  return key && key.startsWith("audit:audit_");
});
```

This ensures only actual audit entries are returned, not the internal `file_audit:` references.

## Rollback (If Needed)

If something goes wrong, you can rollback by removing the filter:

```typescript
// Just use this line without the filter
let audits = await kv.getByPrefix("audit:");
```

But this will bring back the duplicate entries issue.
