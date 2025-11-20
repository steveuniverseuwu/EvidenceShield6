# Tampered Status Display Fix

## Issue
The audit trail was not properly displaying "Tampered" status when a verification failed (file hash mismatch).

## Root Cause
The backend `/verify-evidence` endpoint was not storing the following critical fields:
- `zkpVerified` - Boolean indicating if the verification was successful
- `verificationType` - Type of verification ('ipfs' or 'local')
- `localFileName` - Name of the local file used for verification

Without these fields, the audit trail couldn't determine if a verification was successful or if tampering was detected.

## Fix Applied

### Backend Changes (`src/supabase/functions/server/index.tsx`)

Updated the `/verify-evidence` endpoint to:

1. **Accept additional parameters**:
   ```typescript
   const {
     fileId,
     txHash,
     verifiedBy,
     verifierName,
     verifierRole,
     zkpProofId,        // NEW
     zkpVerified,       // NEW - true/false for success/tampered
     verificationType,  // NEW - 'ipfs' or 'local'
     localFileName,     // NEW - local file name if applicable
   } = body;
   ```

2. **Store verification status in audit event**:
   ```typescript
   const auditEvent = {
     id: generateEventId(),
     eventType: "verify",
     fileId,
     fileName: fileData.fileName,
     caseNumber: fileData.caseNumber,
     performedBy: verifiedBy || "system",
     performerName: verifierName || "System Verification",
     performerRole: verifierRole || "System",
     txHash: verificationTxHash,
     timestamp: new Date().toISOString(),
     details: `Verification ${zkpVerified ? "successful" : "failed"}: ${fileData.fileName}${verificationType ? ` (${verificationType} verification)` : ''}`,
     zkpProofId: zkpProofId || undefined,
     zkpVerified: zkpVerified !== undefined ? zkpVerified : verified,  // NEW
     verificationType: verificationType || undefined,                   // NEW
     localFileName: localFileName || undefined,                         // NEW
   };
   ```

3. **Return verification status in response**:
   ```typescript
   return c.json({
     verified,
     zkpVerified,           // NEW
     verificationType,      // NEW
     fileData: verified ? fileData : null,
     verificationTxHash,    // NEW
   });
   ```

## How It Works Now

### Successful Verification
1. User verifies file (IPFS or Local)
2. Hash matches stored hash
3. Frontend sends: `zkpVerified: true`
4. Backend stores: `zkpVerified: true`
5. Audit trail displays: **✓ Verified** (green)

### Failed Verification (Tampered)
1. User verifies file (IPFS or Local)
2. Hash does NOT match stored hash
3. Frontend sends: `zkpVerified: false`
4. Backend stores: `zkpVerified: false`
5. Audit trail displays: **✗ Tampered** (red)

## Frontend Flow

### IPFS Verification
```typescript
// In ZKPVerificationBadge.tsx - handleVerify()
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/verify-evidence`,
  {
    method: "POST",
    body: JSON.stringify({
      fileId: fileId,
      txHash: txHash,
      zkpProofId: zkpProofId,
      zkpVerified: isValid,              // TRUE or FALSE based on hash comparison
      verifiedBy: currentUser.email,
      verifierName: currentUser.name,
      verifierRole: currentUser.role,
      verificationType: 'ipfs',           // Indicates IPFS verification
    }),
  }
);
```

### Local Verification
```typescript
// In ZKPVerificationBadge.tsx - handleVerifyLocal()
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/verify-evidence`,
  {
    method: "POST",
    body: JSON.stringify({
      fileId: fileId,
      txHash: txHash,
      zkpProofId: zkpProofId,
      zkpVerified: isValid,              // TRUE or FALSE based on hash comparison
      verifiedBy: currentUser.email,
      verifierName: currentUser.name,
      verifierRole: currentUser.role,
      verificationType: 'local',          // Indicates local verification
      localFileName: file.name,           // Name of selected local file
    }),
  }
);
```

## Audit Trail Display

The audit trail now shows:

### For Successful Verification:
```
[Shield Icon] Evidence Verified [📁 Local / 🌐 IPFS]
filename.pdf • Case: 32131
Zero-Knowledge Proof: ZKP-1763518944756-x3r17ob8j
[Green Check] ✓ Verified
```

### For Tampered Detection:
```
[Shield Icon] Evidence Verified [📁 Local / 🌐 IPFS]
filename.pdf • Case: 32131
Zero-Knowledge Proof: ZKP-1763518944756-x3r17ob8j
[Red X] ✗ Tampered
```

## Testing Scenarios

### Test 1: Successful IPFS Verification
1. Upload a file
2. Click "Verify Proof" (IPFS verification)
3. File hash matches
4. Result: Modal shows success, Audit trail shows "✓ Verified" in green

### Test 2: Tampered IPFS Verification
1. Upload a file
2. Manually modify the file in storage (simulate tampering)
3. Click "Verify Proof"
4. File hash does NOT match
5. Result: Modal shows failure, Audit trail shows "✗ Tampered" in red

### Test 3: Successful Local Verification
1. Upload a file
2. Download the file to your computer
3. Click "Verify Local"
4. Select the downloaded file
5. Result: Modal shows success, Audit trail shows "✓ Verified" with "📁 Local" badge

### Test 4: Tampered Local Verification
1. Upload a file
2. Download and modify the file
3. Click "Verify Local"
4. Select the modified file
5. Result: Modal shows failure, Audit trail shows "✗ Tampered" in red with "📁 Local" badge

## Summary

✅ **Backend now properly stores verification status** (`zkpVerified`)
✅ **Backend stores verification type** ('ipfs' or 'local')
✅ **Backend stores local file name** when applicable
✅ **Audit trail correctly displays "✗ Tampered"** in red for failed verifications
✅ **Audit trail correctly displays "✓ Verified"** in green for successful verifications
✅ **Verification type badges** show whether it was IPFS or Local verification

## Additional Fix: Audit Trail Event Title

### Issue
The audit trail was showing "Evidence Verified" for all verification events, even when the verification failed and the file was tampered.

### Solution
Updated the `getEventLabel`, `getEventIcon`, and `getEventColor` functions in `AuditTrail.tsx` to:

1. **Dynamic Event Title**:
   - Success: "Evidence Verified" (green text)
   - Failure: "Evidence Verification Failed - Tampered" (red text)

2. **Dynamic Icons**:
   - Success: Green checkmark icon
   - Failure: Red alert circle icon

3. **Dynamic Background Colors**:
   - Success: Green background (`bg-green-50 border-green-200`)
   - Failure: Red background (`bg-red-50 border-red-200`)

### Code Changes

```typescript
const getEventLabel = (type: string, event?: AuditEvent) => {
  switch (type) {
    case "verify":
      if (event && event.zkpVerified === false) {
        return "Evidence Verification Failed - Tampered";
      }
      return "Evidence Verified";
    // ... other cases
  }
};

const getEventIcon = (type: string, event?: AuditEvent) => {
  switch (type) {
    case "verify":
      if (event && event.zkpVerified === false) {
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      }
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    // ... other cases
  }
};

const getEventColor = (type: string, event?: AuditEvent) => {
  switch (type) {
    case "verify":
      if (event && event.zkpVerified === false) {
        return "bg-red-50 border-red-200";
      }
      return "bg-green-50 border-green-200";
    // ... other cases
  }
};
```

### Visual Result

**Failed Verification (Tampered)**:
```
┌─────────────────────────────────────────────────────────────┐
│ [🔴 Alert Icon]  Evidence Verification Failed - Tampered   │
│                  [📁 Local / 🌐 IPFS Badge]                │
│ filename.pdf • Case: 32131                                  │
│                                                              │
│ Zero-Knowledge Proof: ZKP-xxx                               │
│ [Red Badge] ✗ Tampered                                      │
│                                                              │
│ Background: Red (bg-red-50)                                 │
└─────────────────────────────────────────────────────────────┘
```

**Successful Verification**:
```
┌─────────────────────────────────────────────────────────────┐
│ [✓ Check Icon]  Evidence Verified                          │
│                 [📁 Local / 🌐 IPFS Badge]                 │
│ filename.pdf • Case: 32131                                  │
│                                                              │
│ Zero-Knowledge Proof: ZKP-xxx                               │
│ [Green Badge] ✓ Verified                                    │
│                                                              │
│ Background: Green (bg-green-50)                             │
└─────────────────────────────────────────────────────────────┘
```

### Complete Visual Indicators

Now when verification fails, the audit trail shows:
- ❌ Red background
- 🔴 Red alert circle icon
- "Evidence Verification Failed - Tampered" in red text
- "✗ Tampered" badge in red
- Verification type badge (📁 Local or 🌐 IPFS)

When verification succeeds:
- ✅ Green background
- ✓ Green checkmark icon
- "Evidence Verified" in standard text
- "✓ Verified" badge in green
- Verification type badge (📁 Local or 🌐 IPFS)
