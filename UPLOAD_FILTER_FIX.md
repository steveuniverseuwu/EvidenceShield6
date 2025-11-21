# Upload Filter Fix - Single Uploads Now Visible

## The Problem

When clicking the "Upload" filter button in the Audit Trail page:
- ❌ Single file uploads were NOT displayed (showing 0 results)
- ✅ Batch uploads WERE displayed correctly in the "Batch Uploads" filter

As shown in the screenshots:
- **UPLOAD1.jpg**: Shows "All" filter with 2 total uploads (1 batch + 1 single)
- **UPLOAD2.jpg**: Shows "Upload" filter with 0 results (BUG - should show the single upload)
- **UPLOAD3.jpg**: Shows "Batch Uploads" filter with 1 result (working correctly)

## Root Cause

The issue was a mismatch between the database value and the filter parameter:

1. **Database**: Single file uploads are stored with `action: "uploaded"` (line 204 in server code)
2. **Filter**: The "Upload" button sends `filter: "upload"` to the server
3. **Server Logic**: The filtering code checked if `audit.action === filter`, which compares:
   - `"uploaded" === "upload"` → ❌ FALSE (no match, so single uploads were hidden)

```typescript
// OLD CODE (Line 713 - BEFORE FIX):
if (filter !== "all") {
  audits = audits.filter((audit: any) => audit.action === filter || audit.eventType === filter);
}
```

## The Fix

Modified the filtering logic in `src/supabase/functions/server/index.tsx` (line 711-721) to handle the mismatch:

```typescript
// NEW CODE (AFTER FIX):
if (filter !== "all") {
  audits = audits.filter((audit: any) => {
    // Handle "upload" filter matching "uploaded" action
    if (filter === "upload" && audit.action === "uploaded") {
      return true;
    }
    return audit.action === filter || audit.eventType === filter;
  });
}
```

Now when the "Upload" filter is selected:
- It checks if the audit has `action: "uploaded"` 
- If yes, it includes it in the results ✅
- Single file uploads are now correctly displayed!

## Files Changed

- ✅ `src/supabase/functions/server/index.tsx` (lines 711-721)

## How to Deploy

### Option 1: Manual Deployment (No CLI Required)

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Login and select project: **qvxkthmxqsawrdaxukii**

2. **Navigate to Edge Functions**
   - Click **Edge Functions** in left sidebar
   - Find function: **make-server-af0976da**
   - Click to open

3. **Update the Code**
   - Click **Edit** or **Deploy new version**
   - Copy ENTIRE content of `src/supabase/functions/server/index.tsx`
   - Paste to replace old code
   - Click **Deploy** or **Save**

### Option 2: Deploy via Supabase CLI

```powershell
# If you have Supabase CLI installed:
supabase functions deploy make-server-af0976da
```

## Testing the Fix

After deployment:

1. **Go to Audit Trail page** in the app
2. **Click "Upload" filter button**
3. **Verify**: Single file uploads should now appear in the list
4. **Test other filters**:
   - "All" → Shows all events ✅
   - "Upload" → Shows single file uploads ✅
   - "Batch Uploads" → Shows batch uploads ✅
   - "Share" → Shows share events ✅
   - "Verify" → Shows verification events ✅
   - "Download" → Shows download events ✅

## Expected Results

**Before Fix:**
- Upload filter: 0 uploads shown ❌
- Single uploads were invisible

**After Fix:**
- Upload filter: Shows all single file uploads ✅
- Each single upload displays:
  - File name and case number
  - "Evidence Uploaded" label
  - Uploader name and role
  - Blockchain transaction hash
  - Timestamp

## Technical Notes

- The mismatch exists because the upload endpoint uses `action: "uploaded"` for grammatical consistency in logs
- The frontend filter uses `"upload"` as a shorter, cleaner filter name
- This fix bridges the gap without requiring database migration or frontend changes
- All other event types (batch_upload, share, verify, download) don't have this issue

## Related Files

- `src/components/AuditTrail.tsx` - Frontend component with filter buttons
- `src/supabase/functions/server/index.tsx` - Backend server with filtering logic
- `UPLOAD1.jpg`, `UPLOAD2.jpg`, `UPLOAD3.jpg` - Screenshots showing the issue

---

✅ **Fix Applied**: Single file uploads now correctly appear in the "Upload" filter!
