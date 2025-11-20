# How to Deploy Supabase Functions

## The Problem
The backend on Supabase Cloud is running OLD code that doesn't properly store the `zkpVerified` field. We need to deploy the UPDATED code.

## Quick Fix (Manual - No CLI needed)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Log in with your credentials
3. Select project: **qvxkthmxqsawrdaxukii**

### Step 2: Navigate to Edge Functions
1. Click **Edge Functions** in the left sidebar
2. Find the function named **make-server-af0976da**
3. Click on it to open

### Step 3: Update the Function Code
1. Look for an **Edit** or **Deploy new version** button
2. Copy the ENTIRE content of `src/supabase/functions/server/index.tsx`
3. Paste it to replace the old code
4. Click **Deploy** or **Save**

### Step 4: Test
1. Go back to the app at http://localhost:5174
2. Verify a file with a WRONG file (to trigger failure)
3. Go to Audit Trail and click Refresh
4. Should now show "Evidence Verification Failed - Tampered" in RED

---

## Alternative: Deploy via CLI (Advanced)

### Step 1: Install Supabase CLI

**Option A: Using Scoop (Recommended for Windows)**
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-RestMethod get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option B: Using npm**
```powershell
npm install -g supabase
```

### Step 2: Login to Supabase
```powershell
supabase login
```
This will open a browser for authentication.

### Step 3: Link Your Project
```powershell
supabase link --project-ref qvxkthmxqsawrdaxukii
```

### Step 4: Deploy the Function
```powershell
supabase functions deploy make-server-af0976da
```

---

## What Changed in the Backend?

The key changes in `src/supabase/functions/server/index.tsx`:

### 1. Always Set zkpVerified as Boolean (Line ~827)
```typescript
// OLD CODE (had undefined values):
zkpVerified: zkpVerified !== undefined ? zkpVerified : verified,

// NEW CODE (always boolean):
auditEvent.zkpVerified = zkpVerified !== undefined ? Boolean(zkpVerified) : Boolean(verified);
```

### 2. Set Details Text Based on Success/Failure (Line ~830)
```typescript
details: `Verification ${zkpVerified ? "successful" : "failed"}: ${fileData.fileName}${verificationType ? ` (${verificationType} verification)` : ''}`,
```

### 3. Added Logging
```typescript
console.log("📝 Creating audit event with zkpVerified:", auditEvent.zkpVerified, "Type:", typeof auditEvent.zkpVerified);
```

---

## Verification After Deployment

After deploying, test:

### Test 1: Successful Verification
1. Upload a file
2. Click "Verify Proof" or download and use "Verify Local" with correct file
3. Should show GREEN success modal
4. Audit trail should show "Evidence Verified" in GREEN

### Test 2: Failed Verification (Tampered)
1. Upload a file
2. Download and modify the file OR select wrong file
3. Click "Verify Local" with modified file
4. Should show RED failure modal "Verification Failed X"
5. Audit trail should show "Evidence Verification Failed - Tampered" in RED with:
   - Red background
   - Red alert icon
   - "✗ Tampered" badge

---

## Troubleshooting

### Issue: "supabase: command not found"
- Supabase CLI not installed
- Run the installation steps above

### Issue: "Failed to link project"
- Make sure you're logged in: `supabase login`
- Check project ID is correct: qvxkthmxqsawrdaxukii

### Issue: "Permission denied"
- You might not have deployment permissions
- Contact project owner to grant access

### Issue: Still showing old behavior after deployment
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Wait 1-2 minutes for changes to propagate
- Check if function deployed successfully in Supabase dashboard

---

## Need Help?

If deployment doesn't work:
1. Share any error messages
2. Check the Supabase function logs in dashboard
3. Verify the function is actually deployed (check version/timestamp)
