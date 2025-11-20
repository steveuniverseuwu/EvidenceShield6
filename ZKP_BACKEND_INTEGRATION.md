# 🔌 ZKP Backend Integration Guide

## 🐛 Current Issue

**Problem:** ZKP proofs are generated on the frontend and sent to the backend, but the backend is NOT storing them in the database.

**Result:** The `ZKPVerificationBadge` component doesn't display because files don't have `zkpProofId` data.

---

## 📊 Data Flow (Current)

```
Frontend (UploadEvidence.tsx)
    ↓
1. Generate ZKP proof
2. Get proof ID and file hash
3. Send to backend in formData
    ↓
Backend (upload-evidence endpoint)
    ↓
❌ MISSING: Save zkpProofId to database
    ↓
Database
    ↓
❌ File record has NO zkpProofId
    ↓
Frontend (EvidenceFiles.tsx)
    ↓
❌ file.zkpProofId is undefined
    ↓
❌ ZKPVerificationBadge doesn't render
```

---

## ✅ Required Backend Changes

### 1. Update Database Schema

Add ZKP fields to the evidence files table:

```sql
ALTER TABLE evidence_files ADD COLUMN zkp_proof_id TEXT;
ALTER TABLE evidence_files ADD COLUMN zkp_file_hash TEXT;
ALTER TABLE evidence_files ADD COLUMN zkp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE evidence_files ADD COLUMN zkp_verification_count INTEGER DEFAULT 0;
```

### 2. Update Backend Upload Handler

**File:** `supabase/functions/make-server-af0976da/index.ts` (or similar)

#### Current Code (Simplified):
```typescript
// Upload endpoint
export async function uploadEvidence(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file');
  const caseNumber = formData.get('caseNumber');
  const description = formData.get('description');
  // ... other fields
  
  // Save to database
  const { data, error } = await supabase
    .from('evidence_files')
    .insert({
      file_name: file.name,
      case_number: caseNumber,
      description: description,
      // ... other fields
    });
}
```

#### Updated Code (With ZKP):
```typescript
// Upload endpoint
export async function uploadEvidence(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file');
  const caseNumber = formData.get('caseNumber');
  const description = formData.get('description');
  
  // 🔐 NEW: Get ZKP proof data
  const zkpProofsJson = formData.get('zkpProofs');
  let zkpProofData = null;
  
  if (zkpProofsJson) {
    try {
      const zkpProofs = JSON.parse(zkpProofsJson as string);
      // For single file upload, get the first proof
      if (zkpProofs.length > 0) {
        zkpProofData = zkpProofs[0];
      }
    } catch (error) {
      console.error('Failed to parse ZKP proofs:', error);
    }
  }
  
  // Save to database
  const { data, error } = await supabase
    .from('evidence_files')
    .insert({
      file_name: file.name,
      case_number: caseNumber,
      description: description,
      // ... other fields
      
      // 🔐 NEW: Add ZKP fields
      zkp_proof_id: zkpProofData?.proofId || null,
      zkp_file_hash: zkpProofData?.fileHash || null,
      zkp_verified: false,
      zkp_verification_count: 0,
    });
}
```

### 3. Update Batch Upload Handler

For batch uploads (multiple files with Merkle tree):

```typescript
export async function uploadBatchEvidence(req: Request) {
  const formData = await req.formData();
  
  // Get files
  const files = [];
  for (let i = 0; i < 20; i++) {
    const file = formData.get(`file${i}`);
    if (file) files.push(file);
  }
  
  // 🔐 NEW: Get ZKP proofs
  const zkpProofsJson = formData.get('zkpProofs');
  let zkpProofs = [];
  
  if (zkpProofsJson) {
    try {
      zkpProofs = JSON.parse(zkpProofsJson as string);
    } catch (error) {
      console.error('Failed to parse ZKP proofs:', error);
    }
  }
  
  // Insert files into database
  const fileRecords = files.map((file, index) => {
    // Find matching ZKP proof by filename
    const zkpProof = zkpProofs.find(p => p.fileName === file.name);
    
    return {
      file_name: file.name,
      case_number: formData.get('caseNumber'),
      description: formData.get('description'),
      // ... other fields
      merkle_root: merkleRoot,
      batch_id: batchId,
      batch_index: index,
      
      // 🔐 NEW: Add ZKP fields
      zkp_proof_id: zkpProof?.proofId || null,
      zkp_file_hash: zkpProof?.fileHash || null,
      zkp_verified: false,
      zkp_verification_count: 0,
    };
  });
  
  await supabase.from('evidence_files').insert(fileRecords);
}
```

### 4. Update GET Endpoint

Make sure the GET endpoint returns the ZKP fields:

```typescript
export async function getEvidence(req: Request) {
  const { data, error } = await supabase
    .from('evidence_files')
    .select(`
      id,
      file_name,
      case_number,
      description,
      file_size,
      ipfs_cid,
      tx_hash,
      uploaded_by,
      uploader_name,
      uploader_role,
      department,
      timestamp,
      shared_with,
      merkle_root,
      batch_id,
      batch_index,
      zkp_proof_id,      -- 🔐 NEW
      zkp_file_hash,     -- 🔐 NEW
      zkp_verified       -- 🔐 NEW
    `)
    .order('timestamp', { ascending: false });
    
  // Transform snake_case to camelCase for frontend
  const files = data.map(file => ({
    id: file.id,
    fileName: file.file_name,
    caseNumber: file.case_number,
    // ... other fields
    zkpProofId: file.zkp_proof_id,        -- 🔐 NEW
    zkpFileHash: file.zkp_file_hash,      -- 🔐 NEW
    zkpVerified: file.zkp_verified,       -- 🔐 NEW
  }));
  
  return { files };
}
```

### 5. Create ZKP Verification Endpoint

Add a new endpoint to track verification attempts:

```typescript
export async function verifyZKPProof(req: Request) {
  const { fileId, proofId } = await req.json();
  
  // In production, this would:
  // 1. Retrieve the proof from storage/blockchain
  // 2. Verify the proof cryptographically
  // 3. Check that the file hash matches
  
  // For now, just increment verification count
  const { data, error } = await supabase
    .from('evidence_files')
    .update({
      zkp_verified: true,
      zkp_verification_count: supabase.raw('zkp_verification_count + 1'),
    })
    .eq('id', fileId)
    .eq('zkp_proof_id', proofId);
    
  return {
    verified: true,
    message: 'Zero-knowledge proof verified successfully!',
  };
}
```

---

## 🧪 Testing the Backend Changes

### 1. Upload a File

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-af0976da/upload-evidence \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@test.pdf" \
  -F "caseNumber=CASE-2025-001" \
  -F "description=Test evidence" \
  -F "zkpProofs=[{\"proofId\":\"ZKP-123\",\"fileHash\":\"abc123\",\"fileName\":\"test.pdf\"}]"
```

### 2. Check Database

```sql
SELECT 
  id, 
  file_name, 
  zkp_proof_id, 
  zkp_file_hash 
FROM evidence_files 
ORDER BY timestamp DESC 
LIMIT 1;
```

Should return:
```
id | file_name | zkp_proof_id | zkp_file_hash
1  | test.pdf  | ZKP-123      | abc123
```

### 3. Get Files from Frontend

The frontend should now receive:
```json
{
  "files": [
    {
      "id": "1",
      "fileName": "test.pdf",
      "zkpProofId": "ZKP-123",
      "zkpFileHash": "abc123"
    }
  ]
}
```

### 4. Verify ZKP Badge Shows

Open Evidence Files page → Should see purple ZKP badge with "Verify Proof" button

---

## 📝 Summary of Changes Needed

| Component | Change | Status |
|-----------|--------|--------|
| Database Schema | Add zkp_proof_id, zkp_file_hash columns | ⚠️ Required |
| Upload Endpoint | Parse and save zkpProofs from formData | ⚠️ Required |
| Batch Upload Endpoint | Map zkpProofs to files by fileName | ⚠️ Required |
| GET Endpoint | Return ZKP fields in response | ⚠️ Required |
| Verify Endpoint | Create new endpoint for verification | 📋 Optional |

---

## 🚀 Quick Fix for Testing (Frontend Only)

If you can't modify the backend right now, you can test the ZKP UI by adding mock data:

### Option 1: Add Mock Data After Fetch

In `EvidenceFiles.tsx`:

```typescript
const fetchFiles = async () => {
  try {
    const response = await fetch(...);
    const data = await response.json();
    
    if (response.ok) {
      const filesWithStatus = data.files || [];
      
      // 🧪 MOCK: Add ZKP proof IDs for testing
      const filesWithZKP = filesWithStatus.map((file: EvidenceFile) => ({
        ...file,
        zkpProofId: `ZKP-${Date.now()}-${file.id}`, // Mock proof ID
        zkpFileHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock hash
      }));
      
      setFiles(filesWithZKP);
    }
  } catch (error) {
    console.error("Error fetching files:", error);
  }
};
```

### Option 2: Check localStorage

After upload, ZKP proofs are stored in localStorage. You can retrieve and display them:

```typescript
// Check if proof exists in localStorage
const storedProof = localStorage.getItem(`zkp_proof_${file.id}`);
if (storedProof) {
  const proof = JSON.parse(storedProof);
  file.zkpProofId = proof.proofId;
  file.zkpFileHash = proof.fileHash;
}
```

---

## 📞 Need Help?

1. **Can't modify backend?** Use the mock data approach above
2. **Backend not in TypeScript?** Adapt the code examples to your language
3. **Using different database?** Adjust SQL queries accordingly
4. **Need more details?** Check the implementation in `UploadEvidence.tsx` lines 108-111

---

**Status:** ⚠️ Backend integration required for ZKP verification to work end-to-end

**Workaround:** Use mock data approach for testing the UI

**Next Steps:** Update backend to save and return zkpProofId and zkpFileHash

---

*Last Updated: 2025-01-16*
