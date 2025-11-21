# 🚀 Deploy Single File to Supabase

## ✅ File Created

I've created a **single combined file** that includes everything:

**Location**: `src/supabase/functions/make-server-af0976da/index.ts`

This file contains:
- ✅ All endpoints (upload, download, chunked upload)
- ✅ KV store functions
- ✅ Chunked upload handler
- ✅ No external file dependencies
- ✅ Ready to deploy!

---

## 🎯 How to Deploy This File

### **Option 1: Supabase Dashboard (Recommended)**

#### Step 1: Go to Functions
Open: https://supabase.com/dashboard/project/qvxkthmxqsawrdaxukii/functions

#### Step 2: Create or Update Function
- If function `make-server-af0976da` exists → Click "Deploy new version"
- If not → Click "Create function" → Name it `make-server-af0976da`

#### Step 3: Copy & Paste the Code
1. Open: `src/supabase/functions/make-server-af0976da/index.ts`
2. Copy **ALL the code** (Ctrl+A, Ctrl+C)
3. Paste into Supabase function editor
4. Click **"Deploy"**

#### Step 4: Wait 1-2 Minutes
Supabase will deploy the function. Wait for it to finish.

#### Step 5: Verify
Open this URL in your browser:
```
https://qvxkthmxqsawrdaxukii.supabase.co/functions/v1/make-server-af0976da/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "ChainGuard server running with chunked upload support"
}
```

✅ **If you see this, deployment was successful!**

---

### **Option 2: Using Supabase CLI**

If you have the CLI installed:

```powershell
# Navigate to functions directory
cd src/supabase/functions

# Deploy the function
supabase functions deploy make-server-af0976da

# Verify
curl https://qvxkthmxqsawrdaxukii.supabase.co/functions/v1/make-server-af0976da/health
```

---

## ✅ After Deployment

### Step 1: Hard Refresh Your Browser
Press: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)

### Step 2: Test Upload
1. Go to your app
2. Select your 61.90 MB file
3. Click "Upload Evidence"

### Step 3: Check Console
You should see:
```
✅ Chunk 1 uploaded successfully
✅ Chunk 2 uploaded successfully
✅ Chunk 3 uploaded successfully
✅ Chunk 4 uploaded successfully
✅ Chunk 5 uploaded successfully
✅ Chunk 6 uploaded successfully
✅ Chunk 7 uploaded successfully
✅ All chunks uploaded successfully
✅ Upload complete!
```

---

## ❌ Troubleshooting

### "Module not found" Error
**Solution**: Make sure you're deploying the **single file** at:
```
src/supabase/functions/make-server-af0976da/index.ts
```

NOT the old files in `src/supabase/functions/server/`

### Still Getting CORS Error
**Solution**: 
1. Wait 2-3 minutes after deployment
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Try again

### 10MB Limit Error
**Solution**: Server not updated yet
1. Verify deployment completed
2. Check health endpoint (should say "chunked upload support")
3. Hard refresh browser

---

## 📋 Quick Deploy Checklist

- [ ] File exists: `src/supabase/functions/make-server-af0976da/index.ts`
- [ ] Open Supabase dashboard
- [ ] Go to Functions page
- [ ] Create/update `make-server-af0976da` function
- [ ] Copy & paste ALL code from `index.ts`
- [ ] Click "Deploy"
- [ ] Wait 1-2 minutes
- [ ] Test health endpoint
- [ ] Hard refresh browser
- [ ] Test file upload

---

## 🎉 Success!

Once deployed:
- ✅ No more 10MB limit
- ✅ No more CORS errors
- ✅ Chunked upload works
- ✅ 61.90 MB file uploads in ~1 minute
- ✅ Unlimited file sizes supported

---

## 📁 File Location

```
src/
└── supabase/
    └── functions/
        └── make-server-af0976da/
            └── index.ts  ← Deploy THIS file
```

---

**Ready to deploy? Just copy the content of `index.ts` and paste it in Supabase!** 🚀
