# Single vs Batch Share Fix ✅

## The Problem

As shown in **SINGLE.jpg**, when sharing **1 file**, the audit trail displayed:
- ❌ "Batch Evidence Shared (Merkle Tree)"
- ❌ "Batch share: 1 files with forensics@lab.gov"
- ❌ Merkle Root displayed (unnecessary for single file)

This was **incorrect** - "Batch" should only appear when sharing **2 or more files** together.

---

## Root Cause

The previous fix made the frontend **always** use the batch share endpoint, even for single files. This was done for "consistency" but created confusion in the audit trail.

**Old Code (Incorrect):**
```typescript
// Always used batch endpoint, even for 1 file
const response = await fetch('/share-batch-evidence', {
  body: JSON.stringify({
    fileIds: selectedFiles, // Even if only 1 file
    ...
  })
});
```

---

## The Solution

Use different endpoints based on the number of files:
- **1 file** → Use single-file share endpoint → "Evidence Shared" in audit
- **2+ files** → Use batch share endpoint → "Batch Evidence Shared (Merkle Tree)" in audit

**New Code (Correct):**
```typescript
const fileCount = selectedFiles.length;

if (fileCount === 1) {
  // Single file - use single-file endpoint
  const response = await fetch('/share-evidence', {
    body: JSON.stringify({
      fileId: selectedFiles[0], // Single fileId (not array)
      sharedBy,
      sharedWith,
      ...
    })
  });
  
  setShareStatus({
    message: `File shared successfully with ${recipientEmail}`,
  });
} else {
  // Multiple files - use batch endpoint
  const response = await fetch('/share-batch-evidence', {
    body: JSON.stringify({
      fileIds: selectedFiles, // Array of file IDs
      sharedBy,
      sharedWith,
      ...
    })
  });
  
  setShareStatus({
    message: `${fileCount} files shared successfully with ${recipientEmail} (Gas-optimized: 1 blockchain transaction)`,
  });
}
```

---

## Expected Behavior

### Single File Share (1 file)

**User Action:**
1. Select **1 file** to share
2. Click "Share Evidence"

**Result:**
- ✅ Success message: "File shared successfully with forensics@lab.gov"
- ✅ Audit trail shows: "Evidence Shared"
- ✅ File name displayed
- ✅ Single blockchain TX hash
- ✅ NO Merkle root (not needed for 1 file)
- ✅ NO "Batch" label

**Audit Entry Example:**
```
📤 Evidence Shared
Document.pdf • Case: CASE-2025-01
Performed by: John Smith (Police Officer)
File shared with: forensics@lab.gov
Blockchain TX: 0xa186d99e729fb01b0d23830...
```

---

### Batch File Share (2+ files)

**User Action:**
1. Select **2 or more files** to share
2. Click "Share Evidence"

**Result:**
- ✅ Success message: "2 files shared successfully with forensics@lab.gov (Gas-optimized: 1 blockchain transaction)"
- ✅ Audit trail shows: "Batch Evidence Shared (Merkle Tree)"
- ✅ File count displayed: "2 files"
- ✅ Single blockchain TX hash (for all files)
- ✅ Merkle root displayed (proves files were shared together)
- ✅ "Batch" label clearly shown

**Audit Entry Example:**
```
🌳 Batch Evidence Shared (Merkle Tree)
2 files • Case: CASE-2025-01
Performed by: John Smith (Police Officer)
Batch share: 2 files with forensics@lab.gov

🌳 Merkle Root: 4aca72bff4cbf4401ee13dbe0bdef8e0a4d06a04100942f5c560c6288b8b98d7
Blockchain TX: 0xa186d99e729fb01b0d23830...
```

---

## Benefits of This Approach

### Clarity
- **Single share** → Clear and simple "Evidence Shared"
- **Batch share** → Explicit "Batch" label with Merkle tree

### Accuracy
- Audit trail accurately reflects what happened
- No confusion about whether it's a single or batch operation
- Merkle root only shown when relevant

### User Experience
- Success messages match the operation:
  - 1 file: "File shared successfully"
  - 2+ files: "2 files shared successfully (Gas-optimized)"
- Users understand the gas optimization benefit

### Technical Correctness
- Single file doesn't need Merkle tree (overkill)
- Batch operation properly uses Merkle tree for integrity
- Backend endpoints used as designed

---

## Gas Optimization Still Works!

### For Single Files (1 file)
- Uses single-file endpoint
- Creates 1 blockchain transaction
- **Cost:** 1 transaction (same as before)
- **No gas savings** (can't optimize a single operation)

### For Multiple Files (2+ files)
- Uses batch endpoint
- Creates 1 blockchain transaction for ALL files
- **Cost:** 1 transaction (instead of N)
- **Gas savings:** 50-90% depending on file count

| Files | Old Cost | New Cost | Savings |
|-------|----------|----------|---------|
| 1     | 1 TX     | 1 TX     | 0%      |
| 2     | 2 TX     | 1 TX     | 50%     |
| 5     | 5 TX     | 1 TX     | 80%     |
| 10    | 10 TX    | 1 TX     | 90%     |

**Gas optimization only applies to 2+ files (where it matters!)**

---

## File Changed

✅ `src/components/ShareEvidence.tsx` (lines 168-237)

**Changes:**
- Added conditional logic to check file count
- Use `/share-evidence` for 1 file
- Use `/share-batch-evidence` for 2+ files
- Different success messages for each case

---

## Testing

### Test Single File Share

1. **Login** as Police Officer
2. **Go to Share Evidence** page
3. **Select 1 file** (not multiple)
4. **Enter recipient:** forensics@lab.gov
5. **Click "Share Evidence"**
6. **✓ Verify success message:** "File shared successfully with forensics@lab.gov"
   - Should NOT say "Gas-optimized"
   - Should NOT mention batch
7. **Go to Audit Trail** page
8. **✓ Verify audit entry:**
   - Title: "Evidence Shared" (NOT "Batch Evidence Shared")
   - Shows single file name
   - Shows blockchain TX
   - NO Merkle root displayed
   - NO "Batch share:" text

### Test Batch File Share (2+ files)

1. **Login** as Police Officer
2. **Go to Share Evidence** page
3. **Select 2 or more files**
4. **Enter recipient:** forensics@lab.gov
5. **Click "Share Evidence"**
6. **✓ Verify success message:** "2 files shared successfully with forensics@lab.gov (Gas-optimized: 1 blockchain transaction)"
   - Should mention gas optimization
   - Should mention batch
7. **Go to Audit Trail** page
8. **✓ Verify audit entry:**
   - Title: "Batch Evidence Shared (Merkle Tree)"
   - Shows "2 files • Case: ..."
   - Shows "Batch share: 2 files with..."
   - Shows Merkle root (green tree icon)
   - Shows single blockchain TX
9. **Click "Batch Shares" filter**
10. **✓ Verify:** Entry appears in batch shares filter

---

## Summary

| Scenario | Endpoint | Success Message | Audit Title | Merkle Root |
|----------|----------|-----------------|-------------|-------------|
| **1 file** | `/share-evidence` | "File shared successfully" | "Evidence Shared" | ❌ No |
| **2+ files** | `/share-batch-evidence` | "X files shared (Gas-optimized: 1 transaction)" | "Batch Evidence Shared (Merkle Tree)" | ✅ Yes |

---

## Related Fixes

This fix complements the previous optimizations:

1. ✅ **Upload Filter Fix** - Single uploads visible
2. ✅ **Batch Share Gas Optimization** - 2+ files = 1 transaction
3. ✅ **Single vs Batch Share Fix** - Correct labels in audit trail (this fix)
4. ✅ **Performance Optimization** - 70-80% CPU reduction

---

## Deployment

Deploy the updated file:
- ✅ `src/components/ShareEvidence.tsx`

Along with previous fixes:
- ✅ `src/supabase/functions/server/index.tsx` (backend)
- ✅ `src/components/AuditTrail.tsx` (frontend)
- ✅ `src/components/BlockchainBackground.tsx` (frontend)

---

✅ **Fix Applied:** Single file shares now correctly display as "Evidence Shared" (not batch)!
