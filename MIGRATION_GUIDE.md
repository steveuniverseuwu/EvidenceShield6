# 🔄 Migration Guide - Consolidated Project

## Overview

The ChainGuard project has been successfully consolidated from a confusing dual-directory structure into a clean, single-configuration setup. This guide helps you understand what changed and how to use the new structure.

## ⚠️ Important: What Changed

### Before (Old Structure)
```
evidenceshield/
├── package.json              ← Root config (not used)
├── vite.config.ts            ← Root config (conflicting)
├── src/
│   ├── package.json          ← Actual config (was used)
│   ├── vite.config.ts        ← Actual config (was used)
│   ├── node_modules/         ← Separate dependencies
│   └── ...source code...
```

**Old commands:**
```bash
cd src && npm install
cd src && npm run dev
```

### After (New Structure)
```
evidenceshield/
├── package.json              ← Single config
├── vite.config.ts            ← Single config
├── tsconfig.json             ← TypeScript config
├── node_modules/             ← Single dependency tree
├── src/
│   └── ...source code...     ← Only source code
```

**New commands:**
```bash
npm install
npm run dev
```

## 🚀 How to Migrate

If you're working with an old clone of this project:

### Step 1: Clean Up Old Dependencies

```bash
# Remove old node_modules
Remove-Item -Recurse -Force src/node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Remove old lock files
Remove-Item src/package-lock.json -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
```

### Step 2: Pull Latest Changes

```bash
git pull origin main
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Application

```bash
npm run dev
```

## 📝 New Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run build:check` | Build with TypeScript type checking |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on the codebase |

## 🔧 Configuration Files

### Kept at Root Level

- ✅ `package.json` - Single merged configuration with all dependencies
- ✅ `vite.config.ts` - Optimized Vite configuration with Node.js polyfills
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `index.html` - HTML entry point

### Removed from src/

- ❌ `src/package.json` - Deleted (consolidated into root)
- ❌ `src/vite.config.ts` - Deleted (consolidated into root)
- ❌ `src/tsconfig.json` - Deleted (consolidated into root)
- ❌ `src/index.html` - Deleted (uses root version)
- ❌ All other duplicate config files

## 🎯 Key Improvements

### 1. Simplified Dependency Management
- **Before**: Had to run `npm install` in two places
- **After**: Single `npm install` at root

### 2. Clearer Project Structure
- **Before**: Confusion about which config was used
- **After**: Standard Vite/React project structure

### 3. Better Documentation
- Updated `README.md` with quick start guide
- Updated `SETUP_GUIDE.md` with simplified instructions
- Added `CONSOLIDATION_SUMMARY.md` with technical details

### 4. Preserved Functionality
- ✅ All React components work exactly the same
- ✅ ZKP functionality preserved with Node.js polyfills
- ✅ Supabase integration unchanged
- ✅ Tailwind CSS and UI components work as before

## 🐛 Troubleshooting

### "Module not found" errors
```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### "Cannot find 'tsc'" error
```bash
# TypeScript should be in devDependencies, reinstall if needed
npm install --save-dev typescript
```

### Port 5173 already in use
```bash
# Kill the existing process or change port in vite.config.ts
# The dev server will automatically suggest an alternative port
```

### Old `src/node_modules` still exists
```bash
# Safe to delete
Remove-Item -Recurse -Force src/node_modules
```

## 📊 Technical Details

### Dependencies
All dependencies were merged and updated to the latest compatible versions:
- React 18.3.1
- TypeScript 5.5.3
- Vite 6.3.5
- Supabase JS 2.45.0
- circomlibjs 0.1.7 (for ZKP)
- All Radix UI components (latest)

### Build Configuration
- **Target**: ESNext for modern browsers
- **Output**: `dist/` directory (was `build/`)
- **Port**: 5173 (Vite default, was 3000)
- **Node Polyfills**: Enabled for ZKP library compatibility

### TypeScript
- **Strict mode**: Enabled for better type safety
- **Path alias**: `@/*` maps to `./src/*`
- **Include**: Only `src/**/*.ts` and `src/**/*.tsx`

## ✅ Verification Checklist

After migrating, verify everything works:

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts the development server
- [ ] Application opens at http://localhost:5173
- [ ] Login page loads correctly
- [ ] No console errors in browser
- [ ] ZKP functionality works (if configured)
- [ ] Supabase integration works (if configured)

## 💡 Best Practices Going Forward

1. **Always work at root level** - No need to `cd src` anymore
2. **Single source of truth** - All configs at root level
3. **Standard npm scripts** - Use `npm run dev`, `npm run build`, etc.
4. **Environment variables** - Keep `.env` at root level
5. **Documentation** - Update docs as you add features

## 🆘 Need Help?

If you encounter issues after migration:

1. Check this guide's troubleshooting section
2. Review `CONSOLIDATION_SUMMARY.md` for technical details
3. Check `SETUP_GUIDE.md` for complete setup instructions
4. Verify your `.env` file has correct Supabase credentials

---

**Status**: ✅ Migration Complete  
**Version**: 1.0.0 (Consolidated)  
**Last Updated**: 2024
