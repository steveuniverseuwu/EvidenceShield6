# Batch Upload Audit Trail Fix

## Problem
When uploading multiple files (batch upload), the audit trail was showing **duplicate entries**:
- Individual "Evidence Uploaded" entries for each file
- One "Batch Upload (Merkle Tree)" entry

**Example:** Upload 2 files → Shows 3 audit entries (2 individual + 1 batch)

This created confusion and cluttered the audit trail.

---

## Solution
**Removed individual file audit entries for batch uploads.**

Now when you upload multiple files, you only see:
- ✅ **ONE** "Batch Upload" entry with all file details

---

## What Changed

### Before:
```typescript
// Created individual audit entries for EACH file in batch
const auditEntry = {
  action: "uploaded",
  fileName: file.fileName,
  details: `File uploaded as part of batch: ${file.fileName}`,
  ...
};
await kv.set(`audit:${auditEntry.id}`, auditEntry); // ❌ Creates duplicate

// PLUS created batch audit entry
const batchAuditEntry = {
  action: "batch_upload",
  fileCount: files.length,
  ...
};
```

### After:
```typescript
// No individual audit entries for batch files

// ONLY creates ONE batch audit entry with all file details
const fileNames = fileData.map((f: any) => f.fileName).join(", ");
const batchAuditEntry = {
  action: "batch_upload",
  fileCount: files.length,
  fileIds: fileData.map((f: any) => f.id),
  fileNames: fileData.map((f: any) => f.fileName),
  details: `Batch upload: 2 files (file1.mp4, file2.mp4)`,
  ...
};
```

---

## Benefits

### 1. **Cleaner Audit Trail**
- No duplicate entries
- Easy to see batch uploads at a glance
- Less clutter

### 2. **Better Details in Batch Entry**
- Shows all file names in the details
- Includes `fileIds` array for tracking
- Includes `fileNames` array for reference

### 3. **Consistent Behavior**
- Single upload → Single "Evidence Uploaded" entry
- Batch upload → Single "Batch Upload" entry

---

## What You'll See Now

### Single File Upload:
```
✅ Evidence Uploaded
   - filename.mp4 • Case: 312312
   - Performed by: John Smith (Police Officer)
   - Blockchain TX: 0x0c2a27c357f580aae...
```

### Batch Upload (2+ files):
```
✅ Batch Upload (Merkle Tree)
   - 2 files • Case: 312312
   - Performed by: John Smith (Police Officer)
   - Batch upload: 2 files (Last Exec Summary.mp4.encrypted, 1 and 2.mp4.encrypted)
   - Merkle Root: d796f64fdcc140c...
   - Blockchain TX: 0x0c2a27c357f580aae...
```

---

## Files Changed

**File:** `src/supabase/functions/server/index.tsx`

**Changes:**
1. **Lines 393-396** (removed ~25 lines):
   - Removed individual audit entry creation loop
   - Each file no longer creates its own "uploaded" audit entry

2. **Lines 400-417** (enhanced):
   - Added `fileNames` to batch details
   - Added `fileIds` array to batch entry
   - Added `fileNames` array to batch entry
   - Improved details text to show actual file names

---

## Deploy Instructions

### You MUST redeploy the server for this fix to work!

#### Option 1: Manual Deploy (5 minutes)
1. Go to https://supabase.com/dashboard
2. Open project **qvxkthmxqsawrdaxukii**
3. Navigate to **Edge Functions** → **make-server-af0976da**
4. Click **Deploy new version**
5. Copy entire content of `src/supabase/functions/server/index.tsx`
6. Paste and click **Deploy**
7. Wait 30 seconds

#### Option 2: CLI Deploy
```powershell
cd src/supabase/functions
supabase functions deploy server --no-verify-jwt
```

---

## Testing After Deploy

### Test Batch Upload:
1. Go to "Upload Evidence"
2. Select **2 or more files** (e.g., 2 video files)
3. Fill in Case Number: `312312`
4. Fill in Description: `Test batch upload`
5. Click "Upload Evidence"
6. Go to "Audit Trail"

### Expected Result:
✅ You should see **ONLY ONE entry**: "Batch Upload (Merkle Tree)"
✅ The entry should show: "Batch upload: 2 files (filename1.ext, filename2.ext)"
✅ NO individual "Evidence Uploaded" entries for those files

### Before vs After:

**BEFORE (❌ Wrong):**
```
Evidence Uploaded - Last Exec Summary.mp4.encrypted
Evidence Uploaded - 1 and 2.mp4.encrypted
Batch Upload (Merkle Tree) - 2 files
```

**AFTER (✅ Correct):**
```
Batch Upload (Merkle Tree) - 2 files (Last Exec Summary.mp4.encrypted, 1 and 2.mp4.encrypted)
```

---

## Note About Existing Data

**Old audit entries will remain** in your database. This fix only affects **NEW uploads** after deployment.

If you want to clean up old duplicate entries:
1. Use the "Reset Storage" feature in the app
2. This will delete all evidence and audit trail data
3. Then upload files again to see the clean audit trail

---

## Summary

✅ **Fixed:** Batch uploads now create only ONE audit entry instead of multiple
✅ **Enhanced:** Batch audit entry includes all file names and IDs
✅ **Result:** Cleaner, more professional audit trail
✅ **Action Required:** Deploy the updated server code

---

**Ready to deploy?** This is a simple fix that makes the audit trail much cleaner and more professional!
