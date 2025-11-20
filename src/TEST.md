# 🔍 STYLING DEBUG CHECKLIST

Your app is running but styles aren't loading. Let's debug:

---

## ✅ Step 1: Run Complete Restart

**In PowerShell:**
```powershell
.\COMPLETE_RESTART.ps1
```

**Or manually:**
```powershell
Remove-Item -Recurse -Force node_modules, .vite -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
pnpm store prune
pnpm install
pnpm run dev
```

---

## ✅ Step 2: Check Browser Console

1. Open app: http://localhost:5173/
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Look for RED errors

**Common errors:**
- ❌ `Failed to parse CSS` → Tailwind not installed
- ❌ `Cannot find module` → Missing packages
- ❌ `Unexpected token` → Syntax error

---

## ✅ Step 3: Check Network Tab

1. In DevTools, click **Network** tab
2. Refresh page (Ctrl+R)
3. Look for `globals.css`
4. Should show **status 200** (green)

If it shows 404 or error → CSS file not loading

---

## ✅ Step 4: Verify Tailwind is installed

**In terminal:**
```powershell
Get-Content node_modules/tailwindcss/package.json | Select-String version
```

Should show: `"version": "3.4.1"` or similar

If command fails → Tailwind not installed

---

## ✅ Step 5: Last Resort - Use npm

If pnpm still has issues:

```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

---

## 🆘 Still Not Working?

**Copy the errors you see and I'll help debug!**

Common fixes:
- Clear browser cache (Ctrl+Shift+Delete)
- Use Incognito mode
- Restart VS Code
- Restart computer (clears locked files)
