# 🛡️ ChainGuard

Blockchain-based evidence management system with role-based authentication and Web3 integration.

## 🚀 SUPER SIMPLE SETUP (VS Code)

### **Option 1: Run PowerShell Script (EASIEST)**

1. Open PowerShell in this folder
2. Run:
```powershell
.\COMPLETE_RESTART.ps1
```
3. Done! Browser opens automatically

---

### **Option 2: Manual Setup**

1. **Stop any running dev server** (Ctrl+C)

2. **Clear everything and reinstall:**
```powershell
# Remove all caches
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install

# Start dev server
pnpm run dev
```

3. **Open:** http://localhost:5173/

---

## 🐛 IF STYLES STILL DON'T LOAD

### Check Browser Console:
1. Press **F12** in browser
2. Look for RED errors in Console tab
3. Check Network tab - verify `globals.css` loaded (status 200)

### Try clearing browser cache:
- Chrome/Edge: **Ctrl + Shift + Delete** → Clear cache
- Or use **Incognito mode**

### Last resort - use npm instead:
```powershell
npm cache clean --force
npm install
npm run dev
```

---

## 🎯 Test the Application

### Default Login Credentials:

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@evidenceshield.com` | `admin123` |
| Police Officer | `officer@evidenceshield.com` | `officer123` |
| Forensics Officer | `forensics@evidenceshield.com` | `forensics123` |
| Prosecutor | `prosecutor@evidenceshield.com` | `prosecutor123` |

---

## 🏗️ Project Structure

```
evidenceshield/
├── .env.local              # Your Supabase credentials (create this!)
├── package.json            # Dependencies
├── App.tsx                 # Main app component
├── components/             # React components
│   ├── LoginPage.tsx
│   ├── UploadEvidence.tsx
│   ├── EvidenceFiles.tsx
│   ├── ShareEvidence.tsx
│   ├── AuditTrail.tsx
│   └── UserTable.tsx
├── supabase/              # Backend
│   └── functions/server/
│       └── index.tsx      # API endpoints
├── styles/
│   └── globals.css        # Global styles
└── utils/
    └── supabase/
        └── info.tsx       # Supabase config
```

---

## 🎨 Features

### ✅ Implemented
- **Role-Based Authentication** - 4 user types with distinct permissions
- **File Upload** - Upload files (max 10MB) with metadata storage
- **Blockchain Simulation** - Mock IPFS CID and Polygon TX hash
- **Real File Storage** - Files stored in database, downloadable as originals
- **File Sharing** - Share between roles (Police → Forensics → Prosecutors)
- **Evidence Verification** - Verify file integrity
- **Audit Trail** - Complete transaction history (Polygonscan-like)
- **Download Tracking** - Track who downloaded what and when
- **Zero-Knowledge Proofs (ZKP)** - Automatic cryptographic proof generation for evidence integrity
  - SHA-256 file hashing
  - ZK-SNARK proof generation (simulated)
  - Blockchain recording of proofs
  - Interactive proof verification
  - Real-time progress tracking
  - See `ZKP_QUICK_START.md` for usage guide

### 🔧 Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Hono)
- **Database**: Supabase KV Store
- **Auth**: Supabase Auth
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🐛 Troubleshooting

### Common Issues:

**"npm: command not found"**
- Install Node.js from https://nodejs.org/

**"Cannot find package.json"**
- Make sure you're in the ROOT directory
- Run: `cd /path/to/evidenceshield`

**"Module not found" errors**
- Run: `npm install`

**"VITE_SUPABASE_URL is not defined"**
- Create `.env.local` file in ROOT directory
- Add Supabase credentials (see step 4 above)

**Download errors**
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Files may need to be re-uploaded

**Port already in use**
- Kill existing process: `pkill -f vite`
- Or change port in `vite.config.ts`

---

## 📖 How It Works

### File Upload Flow
1. User selects file (max 10MB)
2. File converted to byte array
3. Stored in KV database with metadata
4. Mock IPFS CID and TX hash generated
5. Audit event created

### File Download Flow
1. User clicks download
2. Backend retrieves file from KV store
3. Byte array converted back to file
4. Browser downloads original file
5. Download event tracked in audit trail

### Role Permissions
- **Administrator**: Manage users only
- **Police**: Upload files, share to Forensics
- **Forensics**: Upload files, share to Prosecutors
- **Prosecutor**: View, verify, and download files only

---

## 🔐 Security Notes

- ✅ Backend uses Supabase service role key (server-side only)
- ✅ Frontend uses anonymous key (safe to expose)
- ✅ All routes protected by auth
- ✅ File integrity verified on upload
- ✅ Complete audit trail of all actions
- ⚠️ This is a demo - IPFS and blockchain are simulated

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

**Quick Deploy Options:**
- Vercel
- Netlify
- Cloudflare Pages

Backend is already deployed on Supabase Edge Functions.

---

## 📝 Notes

- **Max file size**: 10MB (database storage limitation)
- **IPFS**: Simulated (files stored in database)
- **Blockchain**: Simulated (mock transaction hashes)
- **Real files**: Yes! Download gets the actual file back
- **Zero-Knowledge Proofs**: Automatic generation with simulated ZK-SNARK circuits

## 🔐 Zero-Knowledge Proof (ZKP) Documentation

- **Quick Start**: See [ZKP_QUICK_START.md](../ZKP_QUICK_START.md)
- **Full Implementation**: See [ZKP_IMPLEMENTATION.md](../ZKP_IMPLEMENTATION.md)
- **Completion Summary**: See [ZKP_COMPLETION_SUMMARY.md](../ZKP_COMPLETION_SUMMARY.md)

---

## 🤝 Contributing

This is a prototype/demo application. Feel free to:
- Report issues
- Suggest improvements
- Fork and modify for your needs

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Need Help?

1. Check the documentation files listed above
2. Look for errors in browser console (F12 → Console)
3. Check terminal for server errors
4. Verify `.env.local` has correct credentials
5. Try `rm -rf node_modules && npm install`

---

**Built with ❤️ using Figma Make**

Last updated: 2025-11-13
