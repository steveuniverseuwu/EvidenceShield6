# Blockchain TX Hash Missing in Verification Audit - FIXED

## 🔍 Issue Identified (from TX.jpg)

When viewing verification entries in the Audit Trail, the blockchain transaction hash showed:
- **"Blockchain TX: N/A"** ❌

**Expected**: Should show the actual blockchain transaction hash from the original file upload.

## 📸 Problem from TX.jpg

The audit trail displayed:
```
Evidence Verified
1 and 2 (Recommendationand Support) (1).mp4 • Case: 21321

Zero-Knowledge Proof: ZKP-1763614160928-6ntlmmrm0
Blockchain TX: N/A  ← Problem!
```

The file was uploaded with a blockchain TX hash, but when verified, the audit entry didn't include it.

## 🔧 Root Cause

In the `verify-evidence` endpoint (`src/supabase/functions/server/index.tsx`):

1. **Frontend WAS sending `txHash`** in the verification request (lines 167, 276 in ZKPVerificationBadge.tsx)
2. **Backend was NOT extracting `txHash`** from the request body (line 442-453)
3. **Backend was NOT storing `txHash`** in the verification audit entry (line 482-502)

So the txHash was being sent but ignored by the backend!

## ✅ Solution Implemented

### Backend Changes

**File**: `src/supabase/functions/server/index.tsx`

**Change 1: Extract txHash from request** (line 445)
```typescript
const {
  fileId,
  caseNumber,
  txHash,  // ← Added this
  zkpProofId,
  zkpVerified,
  // ... rest
} = body;
```

**Change 2: Fallback to file metadata** (lines 469-480)
```typescript
// Get file metadata to retrieve fileName, caseNumber, and txHash if not provided
let fileName = localFileName || "N/A";
let caseName = caseNumber;
let transactionHash = txHash;

if (fileId && (!caseName || fileName === "N/A" || !transactionHash)) {
  const fileData = await kv.get(`evidence:${fileId}`);
  if (fileData) {
    if (!caseName) caseName = fileData.caseNumber;
    if (fileName === "N/A") fileName = fileData.fileName;
    if (!transactionHash) transactionHash = fileData.txHash;  // ← Fallback
  }
}
```

**Change 3: Store txHash in audit entry** (line 492)
```typescript
const auditEntry = {
  id: `audit_...`,
  fileId,
  fileName: fileName,
  caseNumber: caseName,
  txHash: transactionHash,  // ← Added this
  action: "verify",
  // ... rest
};
```

## 🎯 How It Works

### Verification Flow (After Fix)

1. **User verifies file** → Frontend sends request with:
   - `fileId`: "file_123"
   - `txHash`: "0x5e585a6a1ba1ee204a47a45095e6eb707fc0b23951c27f6b8ee53214c9d28a2"
   - `caseNumber`: "21321"
   - `timestamp`: Verification time
   - Other verification data

2. **Backend receives request** → Extracts `txHash` from request body

3. **Fallback logic** → If `txHash` not provided:
   - Fetches file metadata from KV store
   - Retrieves original `txHash` from file upload
   
4. **Create audit entry** → Stores complete data:
   - ✅ `txHash`: Actual blockchain transaction hash
   - ✅ `caseNumber`: Case number
   - ✅ `timestamp`: Exact verification time
   - ✅ All other verification details

5. **Audit Trail displays** → Shows complete information:
   - "Blockchain TX: 0x5e585a6a1ba1ee204a47a45095e6eb707fc0b23951c27f6b8ee53214c9d28a2"
   - With clickable link to Polygonscan

## 📊 Before/After Comparison

### Before Fix
```
[🔍 Evidence Verified]
1 and 2 (Recommendationand Support) (1).mp4

Performed by: John Smith (Police Officer)
Local file verification: Valid (ZKP: ZKP-1763614160928-6ntlmmrm0)

Zero-Knowledge Proof: ZKP-1763614160928-6ntlmmrm0 ✓ Verified
Blockchain TX: N/A  ❌

Case: 21321
11/20/2025, 12:51:13 PM
```

### After Fix
```
[🔍 Evidence Verified]
1 and 2 (Recommendationand Support) (1).mp4

Performed by: John Smith (Police Officer)
Local file verification: Valid (ZKP: ZKP-1763614160928-6ntlmmrm0)

Zero-Knowledge Proof: ZKP-1763614160928-6ntlmmrm0 ✓ Verified
Blockchain TX: 0x5e585a6a1ba1ee204a47a45095e6eb707fc0b23951c27f6b8ee53214c9d28a2  ✅
              [View on Polygonscan →]

Case: 21321
11/20/2025, 12:51:13 PM
```

## 📁 Files Modified

### Backend
- **`src/supabase/functions/server/index.tsx`**
  - Extract `txHash` from request body (line 445)
  - Add fallback logic to fetch from file metadata (lines 469-480)
  - Store `txHash` in audit entry (line 492)

### Frontend
- **No changes needed** - Already sending `txHash` correctly

## 🧪 Testing

### Test Case 1: IPFS Verification
1. Upload a file → Note the TX hash in the upload confirmation
2. Go to "My Evidence" → Click "Verify Proof" on the file
3. After verification succeeds → Go to "Audit Trail"
4. Click "Refresh"
5. **Expected**: 
   - ✅ "Blockchain TX" shows the actual hash
   - ✅ Hash is clickable and links to Polygonscan
   - ✅ Case number displays correctly
   - ✅ Timestamp matches verification time

### Test Case 2: Local File Verification
1. Upload a file → Note the TX hash
2. Go to "My Evidence" → Click "Verify Local"
3. Select the original file → Verify succeeds
4. Go to "Audit Trail" → Click "Refresh"
5. **Expected**:
   - ✅ "Blockchain TX" shows the actual hash
   - ✅ All other details correct

### Test Case 3: Batch Upload Verification
1. Upload batch with 2 files → Note TX hash and Merkle root
2. Verify one of the files
3. Check Audit Trail
4. **Expected**:
   - ✅ Verification entry shows TX hash
   - ✅ Shows Merkle root as well

## 🔄 Complete Fix Summary

This fix is part of a comprehensive audit trail improvement that includes:

### 1. Batch Upload Duplicates (FIXED)
- **Issue**: 1 batch with 2 files showed 3 audit entries
- **Fix**: Filter out `file_audit:` references
- **File**: `src/supabase/functions/server/index.tsx` (lines 687-692)

### 2. Verification Timestamp Mismatch (FIXED)
- **Issue**: 2-second difference between verification modal and audit trail
- **Fix**: Send and use frontend timestamp
- **Files**: 
  - `src/components/ZKPVerificationBadge.tsx` (send timestamp)
  - `src/supabase/functions/server/index.tsx` (use frontend timestamp)

### 3. Case Number Missing (FIXED)
- **Issue**: Verification audit entries showed "Case: N/A"
- **Fix**: Pass caseNumber from frontend and fallback to file metadata
- **Files**:
  - `src/components/ZKPVerificationBadge.tsx` (add caseNumber prop)
  - `src/components/EvidenceFiles.tsx` (pass caseNumber)
  - `src/supabase/functions/server/index.tsx` (store caseNumber)

### 4. Blockchain TX Hash Missing (FIXED - This One!)
- **Issue**: Verification audit entries showed "Blockchain TX: N/A"
- **Fix**: Extract txHash from request and fallback to file metadata
- **File**: `src/supabase/functions/server/index.tsx` (extract and store txHash)

## 🚀 Deployment

Deploy the updated server function:

```powershell
supabase functions deploy make-server-af0976da --no-verify-jwt
```

No frontend changes needed - it's already sending the txHash correctly!

## ✅ Success Criteria

After deployment, verification audit entries should show:
- ✅ Correct timestamp (matches verification modal)
- ✅ Correct case number (not "N/A")
- ✅ Correct blockchain TX hash (not "N/A")
- ✅ Clickable Polygonscan link
- ✅ All ZKP and verification details

The audit trail is now COMPLETE with all necessary information for forensic tracking and legal compliance! 🎉
