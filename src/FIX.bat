@echo off
echo ================================================
echo   EVIDENCESHIELD - COMPLETE FIX
echo ================================================
echo.

echo [1/5] Stopping dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Removing node_modules...
if exist node_modules rmdir /s /q node_modules
if exist .vite rmdir /s /q .vite

echo [3/5] Removing lock files...
if exist pnpm-lock.yaml del /f pnpm-lock.yaml
if exist package-lock.json del /f package-lock.json

echo [4/5] Installing packages...
call pnpm install

echo [5/5] Starting dev server...
echo.
echo ================================================
echo   Opening browser at http://localhost:5173/
echo ================================================
echo.
call pnpm run dev
