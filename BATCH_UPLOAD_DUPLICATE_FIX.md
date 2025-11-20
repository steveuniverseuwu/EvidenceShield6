# Batch Upload Duplicate Audit Entries - FIXED

## Problem
When uploading 1 batch with 2 files, the Audit Trail displayed 3 entries instead of 1:
- 2 individual "Evidence Uploaded" entries (one for each file)
- 1 "Batch Upload (Merkle Tree)" entry

## Root Cause
The issue was in the `get-audit-trail` endpoint in `src/supabase/functions/server/index.tsx`.

When fetching audit entries using `getByPrefix("audit:")`, it was returning:
1. **Main audit entries**: `audit:audit_{id}` 
2. **File audit references**: `file_audit:{fileId}:audit_{id}` (duplicates)

Since `"file_audit:"` starts with `"audit"`, the prefix search was returning both types of entries.

The `file_audit:` entries are just references for per-file audit lookups - they should NOT be displayed in the main audit trail.

## Solution
Added a filter in the `get-audit-trail` endpoint (line 674-677) to exclude `file_audit:` references:

```typescript
// IMPORTANT: Filter out file_audit references (they're duplicates)
// Only keep main audit entries (audit:{id})
audits = audits.filter((audit: any) => {
  const key = audit.key || audit._key;
  return key && key.startsWith("audit:audit_");
});
```

## What Changed
- **Before**: Fetching audit entries returned both `audit:audit_{id}` AND `file_audit:{fileId}:audit_{id}` entries
- **After**: Only `audit:audit_{id}` entries are returned, filtering out the duplicate `file_audit:` references

## Result
Now when you upload 1 batch with 2 files, you see:
- ✅ 1 "Batch Upload (Merkle Tree)" entry showing "2 files"

The individual file entries are no longer duplicated in the audit trail.

## Files Modified
- `src/supabase/functions/server/index.tsx` - Added filter to exclude `file_audit:` references

## Testing
To test the fix:
1. Deploy the updated server code
2. Upload a batch with 2 files
3. Check the Audit Trail - should only show 1 batch entry
4. Individual files are still tracked in "My Evidence" page
