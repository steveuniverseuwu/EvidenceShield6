# Local File Verification Feature

## Overview
Added a new "Verify Local" button that allows users to verify files from their computer storage against the stored file hash in the evidence system. This complements the existing IPFS verification by providing an alternative verification method.

## Changes Made

### 1. **ZKPVerificationBadge Component** (`src/components/ZKPVerificationBadge.tsx`)

#### New State Variables
- `verifyingLocal`: Tracks the local verification loading state
- `verificationType`: Added to `verificationResult` to distinguish between 'ipfs' and 'local' verification

#### New Function: `handleVerifyLocal()`
- Creates a file input dialog for users to select a file from their computer
- Computes the SHA-256 hash of the selected file
- Compares the computed hash with the stored file hash
- Records the verification result in the audit trail and blockchain
- Displays success/failure message with detailed information

#### UI Updates
- Added "Verify Local" button (with folder icon) next to the "Verify Proof" button
- Both buttons are displayed in a grid layout (side by side)
- Buttons are disabled during verification to prevent multiple concurrent verifications
- Added verification type badge in modal (📁 Local File / 🌐 IPFS Storage)
- Updated modal to show which verification method was used

### 2. **AuditTrail Component** (`src/components/AuditTrail.tsx`)

#### Interface Updates
- Added `verificationType?: 'ipfs' | 'local'` to `AuditEvent` interface
- Added `localFileName?: string` to track the local file name used for verification

#### Display Enhancements
- Verification events now show a badge indicating the verification type:
  - 📁 Local - for local file verification
  - 🌐 IPFS - for IPFS storage verification
- Local file name is displayed when available
- Verification status now shows:
  - ✓ Verified (green) - when file integrity is confirmed
  - ✗ Tampered (red) - when file hash mismatch is detected

## How It Works

### IPFS Verification (Existing)
1. Downloads the file from IPFS storage
2. Decrypts if necessary
3. Computes hash and compares with stored hash
4. Records verification in audit trail

### Local Verification (New)
1. User clicks "Verify Local" button
2. File picker dialog opens
3. User selects a file from their computer
4. System computes SHA-256 hash of the selected file
5. Compares with stored file hash
6. Shows success/failure result
7. Records verification event in audit trail with:
   - Verification type: 'local'
   - Local file name
   - Verification result (success/tampered)
   - Timestamp and user info

## User Experience

### Success Scenario
When a user selects the correct file:
- ✅ Green success modal appears
- Shows "Local file verification successful!"
- Displays file name, hash match confirmation
- Records the verification in audit trail
- Audit trail shows green ✓ Verified badge

### Failure Scenario
When a user selects a wrong or modified file:
- ❌ Red failure modal appears
- Shows "Local verification failed!"
- Explains that hash mismatch was detected
- Warns that file may have been modified
- Records the verification in audit trail
- Audit trail shows red ✗ Tampered badge

## Benefits

1. **Dual Verification**: Users can verify files both from IPFS storage and local storage
2. **Convenience**: No need to download from IPFS if user already has the file
3. **Transparency**: Clear indication of which verification method was used
4. **Audit Trail**: All verification attempts are recorded with detailed information
5. **Tamper Detection**: System clearly identifies when files don't match stored hashes

## Technical Details

### Hash Computation
- Uses SHA-256 algorithm
- Hashes are normalized (lowercase, '0x' prefix removed) before comparison
- Same hashing function used for both verification types

### Backend Integration
- Sends verification data to `/verify-evidence` endpoint
- Includes `verificationType` parameter ('ipfs' or 'local')
- Includes `zkpVerified` boolean (true for successful, false for tampered)
- Includes `localFileName` when verifying local files
- Records in blockchain and database
- **Tampered Detection**: When `zkpVerified: false` is sent, the audit trail will display "✗ Tampered" in red

### UI Components
- Purple button for IPFS verification
- Indigo button for local verification
- Consistent styling with existing design system
- Responsive grid layout

## Testing Recommendations

1. **Test successful verification**: Upload a file, download it, verify using "Verify Local"
2. **Test tampered file**: Modify the downloaded file and try to verify
3. **Test wrong file**: Select a completely different file
4. **Test audit trail**: Check that all verifications are properly recorded
5. **Test both methods**: Verify same file using both IPFS and Local methods
6. **Test concurrent verification**: Ensure buttons are properly disabled

## Future Enhancements

- Add bulk local verification for multiple files
- Show hash comparison details in modal
- Add file size verification
- Export verification reports
- Add verification history timeline
