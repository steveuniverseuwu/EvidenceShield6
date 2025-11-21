# 🚀 Deploy Updated Server - Fix CORS and 10MB Limit

## ⚠️ Problem

Your server is still running **old code** with:
- ❌ 10MB file size limit
- ❌ Missing chunked upload endpoints
- ❌ CORS errors on `/upload-chunk`

## ✅ Solution: Deploy Updated Server Code

### Option 1: Quick Deploy via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/functions

2. **Find your function**: `make-server-af0976da`

3. **Click "Deploy new version"**

4. **Upload the server files**:
   - Upload `src/supabase/functions/server/index.tsx`
   - Upload `src/supabase/functions/server/kv_store.tsx`
   - Upload `src/supabase/functions/server/chunked-upload-handler.tsx` (new)
   - Upload `src/supabase/functions/server/blockchain.tsx`
   - Upload `src/supabase/functions/server/web3storage.tsx`

5. **Click Deploy**

6. **Wait 1-2 minutes** for deployment to complete

7. **Test**: Try uploading your files again

---

### Option 2: Deploy via Supabase CLI

#### Step 1: Install Supabase CLI (if not installed)

```powershell
# Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

#### Step 2: Login to Supabase

```powershell
supabase login
```

This will open your browser - login with your Supabase account.

#### Step 3: Link to Your Project

```powershell
supabase link --project-ref qvxkthmxqsawrdaxukii
```

Enter your database password when prompted.

#### Step 4: Deploy the Function

```powershell
cd src/supabase/functions
supabase functions deploy make-server-af0976da
```

#### Step 5: Verify Deployment

```powershell
# Test health endpoint
curl https://qvxkthmxqsawrdaxukii.supabase.co/functions/v1/make-server-af0976da/health

# Should return:
# {"status":"ok","message":"ChainGuard server running with chunked upload support"}
```

---

### Option 3: Manual Deployment (Supabase Dashboard)

1. **Go to**: https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/functions

2. **Create or update function**: `make-server-af0976da`

3. **Copy server code**:
   - Open `src/supabase/functions/server/index.tsx`
   - Copy ALL the code
   - Paste into Supabase function editor

4. **Add dependencies** (in function settings):
   ```
   npm:hono
   npm:hono/cors
   npm:hono/logger
   node:crypto
   ```

5. **Deploy**

---

## 🔍 How to Verify It's Working

After deployment, test with:

```bash
# Test health endpoint
curl https://qvxkthmxqsawrdaxukii.supabase.co/functions/v1/make-server-af0976da/health

# Should return:
{
  "status": "ok",
  "message": "ChainGuard server running with chunked upload support"
}
```

**If you see "chunked upload support" in the message, it's deployed!** ✅

---

## 🧪 After Deployment - Test Upload

1. Refresh your application (hard refresh: Ctrl+Shift+R)
2. Try uploading your 61.90 MB file
3. Check console - should see:
   ```
   ✅ Chunk 1 uploaded successfully
   ✅ Chunk 2 uploaded successfully
   ✅ Chunk 3 uploaded successfully
   ...
   ```

---

## ❌ If You Still See Errors

### CORS Error
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solution**: Server not deployed yet. Redeploy and wait 2 minutes.

### 10MB Error
```
File too large. Maximum size is 10MB
```

**Solution**: Old server code still running. Redeploy with updated code.

### 404 Error on /upload-chunk
```
404 Not Found: /upload-chunk
```

**Solution**: Chunked upload endpoints not deployed. Deploy the full updated server code.

---

## 📋 Quick Checklist

Before testing:
- [ ] Server redeployed with updated code
- [ ] Wait 1-2 minutes for deployment
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test health endpoint (see "chunked upload support")
- [ ] Try uploading large file

---

## 🆘 Need Help?

If deployment fails, check:

1. **Supabase logs**: https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/logs
2. **Function logs**: Look for errors during deployment
3. **Project quotas**: Make sure you haven't hit free tier limits

---

## 💡 Alternative: Test Locally First

You can test the server locally before deploying:

```powershell
# Start local Supabase server
cd src/supabase/functions
deno run --allow-net --allow-env server/index.tsx
```

Then in your app, change the endpoint to `http://localhost:8000` temporarily.

---

## ✅ Expected Result After Deployment

Your uploads will:
- ✅ Work for files of any size
- ✅ Use chunked upload automatically (> 50MB)
- ✅ Complete in ~1 minute (for 60MB file)
- ✅ Show real-time progress
- ✅ No CORS errors
- ✅ No 10MB limit errors

---

**Please deploy the server and try again!** The code is ready, it just needs to be deployed to Supabase. 🚀
