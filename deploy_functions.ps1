# Deploy Supabase Functions Script

Write-Host "📦 Installing Supabase CLI..." -ForegroundColor Cyan

# Install Supabase CLI using scoop (recommended for Windows)
if (!(Get-Command scoop -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Scoop not found. Installing Scoop first..." -ForegroundColor Yellow
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Invoke-RestMethod get.scoop.sh | Invoke-Expression
}

Write-Host "Installing Supabase CLI via Scoop..." -ForegroundColor Cyan
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

Write-Host "`n✅ Supabase CLI installed!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: supabase login" -ForegroundColor White
Write-Host "2. Run: supabase link --project-ref qvxkthmxqsawrdaxukii" -ForegroundColor White
Write-Host "3. Run: supabase functions deploy make-server-af0976da" -ForegroundColor White
Write-Host "`nOr use the manual deployment instructions in DEPLOY_INSTRUCTIONS.md" -ForegroundColor Yellow
