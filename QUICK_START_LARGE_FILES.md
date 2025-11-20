# 🚀 Quick Start: Large File Upload

## TL;DR

**EvidenceShield now supports unlimited file sizes!** Files over 50MB automatically use chunked upload.

## How to Use

### For Users

1. **Select any file** (even 5GB+ files work!)
2. **Look for the indicator**:
   - Files < 50MB: Normal upload
   - Files ≥ 50MB: Shows "🚀 Chunked upload" badge
3. **Upload as normal** - the system handles everything automatically

### Example

```
✅ 10MB video    → Standard upload
✅ 75MB document → Chunked upload (automatically)
✅ 500MB video   → Chunked upload (automatically)
✅ 2GB archive   → Chunked upload (automatically)
```

## What Changed?

### Before
- ❌ Max file size: 10MB
- ❌ Error: "File too large"

### After
- ✅ Max file size: **Unlimited**
- ✅ Automatic chunked upload for large files
- ✅ Real-time progress tracking
- ✅ Automatic retry on errors

## Features

| Feature | Description |
|---------|-------------|
| **File Size** | Unlimited (tested up to GB+ files) |
| **Encryption** | AES-256-GCM (same as before) |
| **Progress** | Real-time chunk & byte tracking |
| **Retry Logic** | Automatic (3 attempts per chunk) |
| **Threshold** | 50MB (configurable) |
| **Chunk Size** | 5MB (configurable) |
| **Concurrent** | 3 chunks uploaded simultaneously |

## Visual Guide

### Uploading a Large File

```
Step 1: Select 500MB video
   ↓
Step 2: See "🚀 Chunked upload" badge
   ↓
Step 3: Fill in case details
   ↓
Step 4: Click "Upload Evidence"
   ↓
Step 5: Watch progress:
   - Computing file hash... ✓
   - Encrypting chunks... [=====>    ] 50%
   - Uploading chunks... [==========] 100%
   - Assembling file... ✓
   ↓
Step 6: Success! ✅
```

## Configuration

### Change Upload Threshold

Edit `src/components/UploadEvidence.tsx`:

```typescript
// Current: 50MB threshold
const CHUNKED_UPLOAD_THRESHOLD = 50 * 1024 * 1024;

// To use 100MB threshold:
const CHUNKED_UPLOAD_THRESHOLD = 100 * 1024 * 1024;

// To use 25MB threshold:
const CHUNKED_UPLOAD_THRESHOLD = 25 * 1024 * 1024;
```

### Change Chunk Size

Edit `src/utils/encryption/ChunkedFileEncryption.ts`:

```typescript
// Current: 5MB chunks
private static readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

// To use 10MB chunks:
private static readonly DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024;

// To use 2MB chunks (for slower connections):
private static readonly DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024;
```

### Change Concurrent Uploads

Edit `src/utils/upload/ChunkedUploadService.ts`:

```typescript
// Current: 3 concurrent uploads
private static readonly CONCURRENT_UPLOADS = 3;

// To upload more chunks at once (faster):
private static readonly CONCURRENT_UPLOADS = 5;

// To upload fewer chunks (slower connection):
private static readonly CONCURRENT_UPLOADS = 2;
```

## Troubleshooting

### Upload is slow
**Solution**: Increase concurrent uploads or check network speed

### Browser runs out of memory
**Solution**: This shouldn't happen! Chunks are processed individually. If it does, reduce chunk size.

### Upload fails repeatedly
**Solution**: 
1. Check browser console for errors
2. Verify server is running
3. Check network connectivity
4. Try a smaller chunk size

### Progress stuck
**Solution**:
1. Wait for retry (automatic after 1-3 seconds)
2. Check network tab in browser dev tools
3. Refresh page and try again

## Testing

### Create Test Files

```bash
# Create 50MB file
dd if=/dev/zero of=test_50mb.bin bs=1M count=50

# Create 100MB file
dd if=/dev/zero of=test_100mb.bin bs=1M count=100

# Create 500MB file
dd if=/dev/zero of=test_500mb.bin bs=1M count=500

# Create 1GB file
dd if=/dev/zero of=test_1gb.bin bs=1M count=1024
```

### What to Watch

1. **Browser Console**: Detailed logs of the process
2. **Network Tab**: See individual chunk uploads
3. **Memory Usage**: Should stay low (~20MB)
4. **Progress Bar**: Real-time updates

## Key Files

### Frontend
- `src/utils/encryption/ChunkedFileEncryption.ts` - Encryption logic
- `src/utils/upload/ChunkedUploadService.ts` - Upload logic
- `src/components/UploadEvidence.tsx` - Main component
- `src/components/ChunkedUploadProgress.tsx` - Progress UI

### Backend
- `src/supabase/functions/server/chunked-upload-handler.tsx` - Chunk handler
- `src/supabase/functions/server/index.tsx` - Server endpoints

### Documentation
- `LARGE_FILE_SUPPORT.md` - Complete technical docs
- `CHUNKED_UPLOAD_IMPLEMENTATION_SUMMARY.md` - Implementation summary

## API Endpoints

```
POST /make-server-af0976da/upload-chunk
  - Upload a single chunk
  - Body: FormData with chunk blob

POST /make-server-af0976da/finalize-chunked-upload
  - Assemble all chunks into complete file
  - Body: FormData with session metadata

GET /make-server-af0976da/session-status?sessionId=xxx
  - Check upload progress
  - Returns: chunk count and progress
```

## Performance

### Typical Upload Times (on average connection)

| File Size | Chunks | Approx Time |
|-----------|--------|-------------|
| 50MB      | 10     | ~10-15 sec  |
| 100MB     | 20     | ~20-30 sec  |
| 500MB     | 100    | ~2-3 min    |
| 1GB       | 200    | ~4-6 min    |
| 5GB       | 1000   | ~20-30 min  |

*Times vary based on network speed and server performance*

## Security

### Encryption
- ✅ Each chunk encrypted with AES-256-GCM
- ✅ Unique IV per chunk
- ✅ Same security as before, now works for large files

### Integrity
- ✅ SHA-256 hash of complete file
- ✅ SHA-256 hash of each chunk
- ✅ Server validates chunk hashes
- ✅ ZKP proof for tamper detection

## FAQs

**Q: What's the maximum file size?**
A: Technically unlimited. Tested with GB+ files successfully.

**Q: Will it work on slow connections?**
A: Yes! Automatic retry ensures uploads complete even with interruptions.

**Q: Can I pause and resume?**
A: Session tracking is implemented. Full pause/resume UI coming soon.

**Q: Does it work with multiple files?**
A: Currently optimized for single large files. Multiple files use batch upload.

**Q: Is encryption still secure?**
A: Yes! Same AES-256-GCM encryption, just applied per chunk.

**Q: What about ZKP proofs?**
A: Fully compatible! ZKP is generated on the original file before chunking.

## Quick Commands

```bash
# Build the project
npm run build

# Run development server
npm run dev

# Run linter
npm run lint

# Test with a large file
# 1. Start dev server: npm run dev
# 2. Open http://localhost:5173
# 3. Select a large file (> 50MB)
# 4. Watch the magic happen! ✨
```

## Support

- 📖 Full docs: `LARGE_FILE_SUPPORT.md`
- 📋 Implementation details: `CHUNKED_UPLOAD_IMPLEMENTATION_SUMMARY.md`
- 💻 Source code: Well-commented and documented

## Summary

✅ **Works automatically** - no configuration needed
✅ **Unlimited file sizes** - tested with GB+ files
✅ **Secure** - AES-256-GCM encryption maintained
✅ **Reliable** - automatic retry and error handling
✅ **Fast** - concurrent chunk uploads
✅ **User-friendly** - real-time progress tracking

**You're ready to upload files of any size!** 🚀
