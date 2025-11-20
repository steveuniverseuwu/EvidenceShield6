# Share Evidence Page - Show Received Files Fix

## 🔍 Issue Identified

When a Forensic Specialist receives shared files from a Police Officer:
- ✅ Files appear in "My Evidence" page
- ✅ Share appears in "Audit Trail" as "Evidence Received"
- ❌ Files do NOT appear in "Share Evidence" page for re-sharing

**Expected Behavior**: Forensic Specialist should see both:
1. Files they uploaded themselves
2. Files shared with them (so they can re-share to Prosecutors)

## 📋 Root Cause

### ShareEvidence Component (Line 55-75)

The `fetchMyFiles` function only called `get-my-uploads`:

```typescript
// OLD - Only fetches uploaded files
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-my-uploads?userEmail=${currentUser.email}`,
  // ...
);
```

This endpoint returns only files uploaded by the user, NOT files shared with them.

### The Problem Flow

1. **Police Officer** shares file with **Forensic Specialist**
2. Backend stores: `user_evidence:forensics@lab.gov:file_123`
3. **Forensic Specialist** goes to "My Evidence" → ✅ Sees the file (calls `get-my-evidence`)
4. **Forensic Specialist** goes to "Share Evidence" → ❌ Doesn't see the file (calls `get-my-uploads`)
5. **Forensic Specialist** cannot re-share to Prosecutor ❌

## ✅ Solution Implemented

### Fetch Both Uploaded AND Shared Files

Updated `fetchMyFiles` function to call BOTH endpoints:

```typescript
// NEW - Fetch both uploaded AND shared files
const [uploadsResponse, evidenceResponse] = await Promise.all([
  fetch(`/get-my-uploads?userEmail=${currentUser.email}`),
  fetch(`/get-my-evidence?userEmail=${currentUser.email}`)
]);

// Combine and deduplicate files by ID
const uploadedFiles = uploadsData.files || [];
const sharedFiles = evidenceData.files || [];

const allFiles = [...uploadedFiles];
const fileIds = new Set(uploadedFiles.map(f => f.id));

// Add shared files that aren't already in the list
sharedFiles.forEach(file => {
  if (!fileIds.has(file.id)) {
    allFiles.push(file);
  }
});

setMyFiles(allFiles);
```

### How It Works

1. **Parallel Fetch**: Call both `get-my-uploads` and `get-my-evidence` simultaneously
2. **Combine Results**: Merge uploaded files and shared files
3. **Deduplicate**: Use Set to avoid duplicate entries if a file appears in both lists
4. **Display**: Show all available files in the Share Evidence page

## 🎯 Complete Share Flow (After Fix)

### Scenario: Police Officer → Forensic Specialist → Prosecutor

**Step 1: Police Officer Uploads File**
- Police Officer uploads "evidence.pdf" (Case: 3213)
- File stored in: `evidence:file_123`
- Reference stored in: `user_evidence:police@officer.gov:file_123`

**Step 2: Police Officer Shares with Forensic Specialist**
- Police Officer goes to "Share Evidence"
- Sees "evidence.pdf" in file list ✅
- Shares with "Dr. Michael Chen (Forensics)"
- Backend creates: `user_evidence:forensics@lab.gov:file_123`

**Step 3: Forensic Specialist Receives File**
- Forensic Specialist logs in
- **My Evidence** → Sees "evidence.pdf" ✅
- **Audit Trail** → Sees "Evidence Received" from Police Officer ✅
- **Share Evidence** → Sees "evidence.pdf" ✅ (NEW!)

**Step 4: Forensic Specialist Shares with Prosecutor**
- Forensic Specialist goes to "Share Evidence"
- Sees "evidence.pdf" in file list ✅ (FIXED!)
- Shares with "Michael Brown (Prosecutor)"
- Backend creates: `user_evidence:prosecutor@da.gov:file_123`

**Step 5: Prosecutor Receives File**
- Prosecutor logs in
- **My Evidence** → Sees "evidence.pdf" ✅
- **Audit Trail** → Sees "Evidence Received" from Forensic Specialist ✅
- **Share Evidence** → Sees "evidence.pdf" ✅ (can share further if needed)

## 📊 Before/After Comparison

### Before Fix

**Forensic Specialist's "Share Evidence" page**:
```
Files Available to Share:
- [No shared files visible] ❌
- Only shows files uploaded by Forensic Specialist

Problem: Cannot re-share files received from Police Officer
```

### After Fix

**Forensic Specialist's "Share Evidence" page**:
```
Files Available to Share:
📁 Case 3213 (2 files)
  ✓ evidence.pdf (shared from Police Officer) ✅
  ✓ analysis-report.pdf (uploaded by Forensic Specialist) ✅

Can now share both types of files with Prosecutors!
```

## 📁 Files Modified

### Frontend
**src/components/ShareEvidence.tsx** (lines 55-98)
- Updated `fetchMyFiles` to fetch both uploaded and shared files
- Added deduplication logic
- Used `Promise.all` for parallel fetching

### Backend
**No changes needed** - The backend endpoints already support this:
- `get-my-uploads` - Returns files uploaded by user
- `get-my-evidence` - Returns files available to user (uploaded + shared)

## 🧪 Testing

### Test Case 1: Police Officer → Forensic Specialist

**As Police Officer**:
1. Upload file "report.pdf" with Case: 5555
2. Go to "Share Evidence"
3. **Expected**: See "report.pdf" ✅
4. Share with "Dr. Michael Chen (Forensics)"

**As Forensic Specialist**:
1. Login as "mike.forensics@lab.gov"
2. Go to "My Evidence"
3. **Expected**: See "report.pdf" ✅
4. Go to "Share Evidence"
5. **Expected**: See "report.pdf" in file list ✅ (FIXED!)
6. **Expected**: Can select and share with Prosecutor ✅

### Test Case 2: Forensic Specialist → Prosecutor

**As Forensic Specialist** (after receiving file):
1. Go to "Share Evidence"
2. **Expected**: See both uploaded files AND received files ✅
3. Select received file "report.pdf"
4. Share with "Michael Brown (Prosecutor)"
5. **Expected**: Share succeeds ✅

**As Prosecutor**:
1. Login as "michael.prosecutor@da.gov"
2. Go to "My Evidence"
3. **Expected**: See "report.pdf" ✅
4. Go to "Audit Trail"
5. **Expected**: See "Evidence Received" from Forensic Specialist ✅

### Test Case 3: Deduplication

**As Police Officer**:
1. Upload file "test.pdf"
2. Go to "Share Evidence"
3. Share with Forensic Specialist
4. Go to "Share Evidence" again
5. **Expected**: File appears only ONCE in list (not duplicated) ✅

## ✅ Benefits

### 1. Complete Share Chain
- Evidence can flow: Police → Forensics → Prosecutor
- Each recipient can re-share files they receive
- Chain of custody maintained at each step

### 2. Better User Experience
- Users see all files they have access to
- Can share both uploaded and received files
- Intuitive workflow matches real-world process

### 3. Forensic Workflow Support
- Forensics receives evidence from Police
- Analyzes and processes
- Can share original evidence + analysis to Prosecutor
- All tracked in audit trail

### 4. No Duplication
- Smart deduplication prevents duplicate entries
- Clean file list
- Performance optimized with parallel fetching

## 🔄 Admin Audit Trail

The admin audit trail already shows all activities from all users:

**How it works** (AuditTrail.tsx line 48-50):
```typescript
const url = currentUser.role === "Administrator"
  ? `get-audit-trail?filter=${filter}`  // No userEmail = see all
  : `get-audit-trail?userEmail=${currentUser.email}&filter=${filter}`;  // Filtered
```

**Backend filtering** (index.tsx line 699-709):
```typescript
if (userEmail) {
  // Regular users: show own actions + shares received
  audits = audits.filter((audit: any) => {
    return audit.performedBy === userEmail || audit.sharedWith === userEmail;
  });
}
// Admin: no filtering = sees everything
```

So Admin already sees:
- ✅ All uploads from Police Officers
- ✅ All uploads from Forensic Specialists  
- ✅ All uploads from Prosecutors
- ✅ All shares between users
- ✅ All verifications
- ✅ All downloads

## 🚀 Deployment

Deploy the updated frontend component:

```powershell
# No backend changes needed
# Just restart frontend
npm run dev
```

Or for production:
```powershell
npm run build
```

## 🎉 Summary

| Feature | Before | After |
|---------|--------|-------|
| Police Officer shares file | ✅ Works | ✅ Works |
| Forensic Specialist sees in "My Evidence" | ✅ Works | ✅ Works |
| Forensic Specialist sees in "Share Evidence" | ❌ No | ✅ Yes |
| Forensic Specialist can re-share | ❌ No | ✅ Yes |
| Prosecutor receives file | ✅ Works | ✅ Works |
| Admin sees all activities | ✅ Works | ✅ Works |
| File deduplication | ❌ No | ✅ Yes |

The complete evidence sharing chain is now fully functional! 🎊
