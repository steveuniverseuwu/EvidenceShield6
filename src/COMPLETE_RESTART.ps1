# EvidenceShield - Complete Restart Script
# This clears ALL caches and reinstalls everything fresh

Write-Host "🛡️  EvidenceShield - Complete Restart" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Stop dev servers
Write-Host "⏹️  Stopping dev servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Remove node_modules
Write-Host "🗑️  Removing node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Remove lock files
Write-Host "🗑️  Removing lock files..." -ForegroundColor Yellow
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Remove caches
Write-Host "🗑️  Removing Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Clear pnpm store
Write-Host "🧹 Clearing pnpm cache..." -ForegroundColor Yellow
pnpm store prune 2>$null

Write-Host ""
Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host ""

# Install
Write-Host "📦 Installing packages..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Starting dev server..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Open your browser to:" -ForegroundColor White
    Write-Host "   👉 http://localhost:5173/" -ForegroundColor Cyan
    Write-Host ""
    
    pnpm run dev
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host "   Try using npm instead:" -ForegroundColor Yellow
    Write-Host "   npm install && npm run dev" -ForegroundColor White
    Write-Host ""
}
