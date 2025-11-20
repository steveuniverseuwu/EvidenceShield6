# 🧪 Test Encryption Fix - Do This Now!

## ✅ What I Fixed

The backend returns:
- **Single file**: `{ fileId: "file_xxx" }`
- **Batch files**: `{ fileIds: ["file_xxx", "file_yyy"] }`

The code was looking for `data.files[]` or `data.file.id`, but the backend returns `data.fileId` and `data.fileIds` instead!

I've updated the code to check for the correct fields first.

---

## 🧪 Test It Right Now:

### Step 1: Clear Old Data (Important!)
Open browser console (F12) and run:
```javascript
// Clear old encryption keys
Object.keys(localStorage)
  .filter(k => k.startsWith('encryption_'))
  .forEach(k => localStorage.removeItem(k));

console.log('✅ Old encryption keys cleared');
```

### Step 2: Upload a NEW Test File
1. Login (officer@police.gov / police123)
2. Go to "Upload Evidence"
3. Upload a **NEW** file (important - must be uploaded AFTER the fix)
4. Use case number: TEST-001
5. Watch the console output

### Step 3: Check Console Logs
You should now see:
```
💾 Storing encryption metadata locally...
Backend response: {...}
Response keys: [...]
Found 1 file IDs in batch response  (or "Storing metadata for single file ID")
Storing metadata for file ID: file_1234567890_abcde, Name: yourfile.pdf
✅ Metadata stored for: yourfile.pdf (ID: file_1234567890_abcde)
```

### Step 4: Verify Storage
Run in console:
```javascript
// Check encryption keys
const keys = Object.keys(localStorage).filter(k => k.startsWith('encryption_'));
console.log('Encryption keys stored:', keys.length);
keys.forEach(k => {
  const data = JSON.parse(localStorage.getItem(k));
  console.log('File:', data.metadata.fileName);
});
```

You should see at least 1 encryption key!

### Step 5: Download the File
1. Go to "My Evidence"
2. Click "Download" on your newly uploaded file
3. Watch console - should see:
```
🔽 Starting download process for: yourfile.pdf
   File ID: file_1234567890_abcde
   Checking for encryption metadata with file ID: file_1234567890_abcde
   Looking for encryption metadata with key: encryption_file_1234567890_abcde
   Available encryption keys: ['encryption_file_1234567890_abcde']  <-- KEY FOUND!
   Encryption data found: YES
🔓 File is encrypted, decrypting...
✅ File decrypted successfully: yourfile.pdf
✅ Decrypted file download initiated: yourfile.pdf
```

The file should download as the **original unencrypted file**! ✅

### Step 6: Verify Proof
1. Click "Verify Proof" on your file
2. Watch console - should see:
```
🔐 Starting ZKP verification for: yourfile.pdf
   Downloading file for verification...
🔓 File is encrypted, decrypting for verification...
✅ File decrypted for verification
   Computing file hash...
   Computed hash: 0x...
   Stored hash: ...
   Hash match: true  <-- SHOULD BE TRUE!
✅ File hash verified - integrity confirmed
```

Verification should succeed! ✅

---

## 🎯 Expected Results

✅ **Upload**: Console shows "Metadata stored for: [filename] (ID: file_xxx)"
✅ **LocalStorage**: Has encryption keys (check with console command)
✅ **Download**: File automatically decrypts and downloads as original
✅ **Verify**: Proof verification succeeds with "Hash match: true"

---

## ⚠️ Important Notes

1. **Old files won't work** - They were uploaded before the fix, so no encryption metadata was stored
2. **Upload a NEW file** after this fix to test
3. **Clear old keys** before testing to avoid confusion
4. **Watch the console** - all debug logs are there

---

## 🐛 If It Still Doesn't Work

Send me the console output showing:
1. The "Backend response:" line (full JSON)
2. The "Response keys:" line
3. Any error messages

This will tell me if the backend is returning something different than expected!

---

## 🚀 Next Steps After Success

Once this works:
1. Encryption/decryption will work for all NEW uploads
2. Old files can be re-uploaded to get encryption
3. We can clean up debug logging
4. Remove the debug panel if desired

**Test it now and let me know the results!** 🎉
