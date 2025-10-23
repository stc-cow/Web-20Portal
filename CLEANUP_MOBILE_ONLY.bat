@echo off
REM ACES MSD Fuel - Mobile Driver App Cleanup (Windows Version)
REM This script restructures the project for mobile-only (Android/iOS + Web Wrapper)

setlocal enabledelayedexpansion

echo.
echo ACES MSD Fuel - Mobile App Restructure
echo ========================================
echo.

REM Verify we're in the right directory
if not exist "code" (
    echo Error: code/ folder not found. Run this script from project root.
    pause
    exit /b 1
)

if not exist "Driver-20App" (
    echo Error: Driver-20App/ folder not found. Run this script from project root.
    pause
    exit /b 1
)

echo Cleanup Plan:
echo   1. Remove web portal pages from Driver-20App/
echo   2. Remove web portal components
echo   3. Remove unused UI components
echo   4. Delete old code/ folder
echo   5. Update package.json to mobile-only
echo   6. Clean install dependencies
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Starting cleanup...
echo.

REM Step 1: Remove web portal pages
echo [1/6] Removing web portal pages...
for /d %%D in ("Driver-20App\client\pages\employees" "Driver-20App\client\pages\missions" "Driver-20App\client\pages\sites" "Driver-20App\client\pages\users" "Driver-20App\client\pages\generators" "Driver-20App\client\pages\reports" "Driver-20App\client\pages\settings" "Driver-20App\client\pages\notifications") do (
    if exist "%%D" rmdir /s /q "%%D"
)
if exist "Driver-20App\client\pages\Login.tsx" del "Driver-20App\client\pages\Login.tsx"
if exist "Driver-20App\client\pages\Placeholder.tsx" del "Driver-20App\client\pages\Placeholder.tsx"
echo [OK] Web pages removed

REM Step 2: Remove web portal components
echo [2/6] Removing web portal components...
for /d %%D in ("Driver-20App\client\components\builder" "Driver-20App\client\components\dashboard" "Driver-20App\client\components\layout" "Driver-20App\client\components\visual") do (
    if exist "%%D" rmdir /s /q "%%D"
)
echo [OK] Web components removed

REM Step 3: Remove unused UI components
echo [3/6] Removing unused UI components...
cd Driver-20App\client\components\ui

for %%F in (
    accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx 
    badge.tsx breadcrumb.tsx calendar.tsx carousel.tsx chart.tsx 
    checkbox.tsx collapsible.tsx command.tsx context-menu.tsx drawer.tsx 
    dropdown-menu.tsx form.tsx hover-card.tsx input-otp.tsx menubar.tsx 
    navigation-menu.tsx pagination.tsx popover.tsx progress.tsx radio-group.tsx 
    resizable.tsx scroll-area.tsx select.tsx separator.tsx sheet.tsx 
    sidebar.tsx skeleton.tsx slider.tsx switch.tsx table.tsx tabs.tsx 
    toggle-group.tsx toggle.tsx
) do (
    if exist "%%F" del "%%F"
)

cd ..\..\..\
echo [OK] Unused UI components removed

REM Step 4: Delete old code folder
echo [4/6] Deleting old code/ folder...
if exist "code" rmdir /s /q "code"
echo [OK] Old code/ removed

REM Step 5: Update package.json
echo [5/6] Updating package.json for mobile-only...
(
echo {
echo   "name": "aces-fuel-driver-mobile",
echo   "description": "ACES MSD Fuel - Mobile Driver Application (Android/iOS + Web Wrapper)",
echo   "version": "1.0.0",
echo   "private": true,
echo   "type": "module",
echo   "pkg": {
echo     "assets": ["dist/spa/*"],
echo     "scripts": ["dist/server/**/*.js"]
echo   },
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "npm run build:client && npm run build:server",
echo     "build:client": "vite build",
echo     "build:server": "vite build --config vite.config.server.ts",
echo     "start": "node dist/server/node-build.mjs",
echo     "test": "vitest --run",
echo     "format.fix": "prettier --write .",
echo     "typecheck": "tsc",
echo     "cap:sync": "pnpm exec cap sync",
echo     "android": "pnpm build && pnpm exec cap copy android && pnpm exec cap open android",
echo     "ios": "pnpm build && pnpm exec cap copy ios && pnpm exec cap open ios"
echo   },
echo   "dependencies": {
echo     "@capacitor/android": "^7.4.3",
echo     "@capacitor/camera": "^7.0.2",
echo     "@capacitor/core": "^7.4.3",
echo     "@capacitor/ios": "^7.4.3",
echo     "@capacitor/local-notifications": "^7.0.3",
echo     "@capacitor/preferences": "^7.0.2",
echo     "@capacitor/push-notifications": "^7.0.3",
echo     "@supabase/supabase-js": "^2.75.0",
echo     "dotenv": "^17.2.1",
echo     "express": "^5.1.0",
echo     "react": "^18.3.1",
echo     "react-dom": "^18.3.1",
echo     "react-router-dom": "^6.30.1",
echo     "sonner": "^1.7.4",
echo     "zod": "^3.25.76"
echo   },
echo   "devDependencies": {
echo     "@capacitor/cli": "^7.4.3",
echo     "@radix-ui/react-dialog": "^1.1.14",
echo     "@radix-ui/react-label": "^2.1.7",
echo     "@radix-ui/react-slot": "^1.2.3",
echo     "@radix-ui/react-toast": "^1.2.14",
echo     "@radix-ui/react-tooltip": "^1.2.7",
echo     "@swc/core": "^1.13.3",
echo     "@types/cors": "^2.8.19",
echo     "@types/express": "^5.0.3",
echo     "@types/node": "^24.2.1",
echo     "@types/react": "^18.3.23",
echo     "@types/react-dom": "^18.3.7",
echo     "@vitejs/plugin-react-swc": "^4.0.0",
echo     "autoprefixer": "^10.4.21",
echo     "class-variance-authority": "^0.7.1",
echo     "clsx": "^2.1.1",
echo     "cors": "^2.8.5",
echo     "globals": "^16.3.0",
echo     "lucide-react": "^0.539.0",
echo     "postcss": "^8.5.6",
echo     "prettier": "^3.6.2",
echo     "serverless-http": "^3.2.0",
echo     "tailwind-merge": "^2.6.0",
echo     "tailwindcss": "^3.4.17",
echo     "tailwindcss-animate": "^1.0.7",
echo     "tsx": "^4.20.3",
echo     "typescript": "^5.9.2",
echo     "vite": "^7.1.2",
echo     "vitest": "^3.2.4"
echo   },
echo   "packageManager": "pnpm@10.14.0+sha512.ad27a79641b49c3e481a16a805baa71817a04bbe06a38d17e60e2eaee83f6a146c6a688125f5792e48dd5ba30e7da52a5cda4c3992b9ccf333f9ce223af84748"
echo }
) > Driver-20App\package.json
echo [OK] package.json updated

REM Step 6: Clean install
echo [6/6] Installing dependencies...
cd Driver-20App
if exist "node_modules" rmdir /s /q "node_modules"
if exist "pnpm-lock.yaml" del "pnpm-lock.yaml"
pnpm install
cd ..
echo [OK] Dependencies installed

echo.
echo ========================================
echo CLEANUP COMPLETE!
echo ========================================
echo.
echo Final Structure:
echo   Driver-20App/                    (root project)
echo   - client/pages/mobile/           Mobile pages only
echo   - client/components/ui/          Essential components (9 files)
echo   - android/                       Native Android app
echo   - ios/                           Native iOS app
echo.
echo Next Steps:
echo   1. cd Driver-20App
echo   2. pnpm dev          (test dev server)
echo   3. pnpm build        (build for production)
echo   4. pnpm android      (open Android Studio)
echo   5. pnpm ios          (open Xcode)
echo.
echo Ready to push to GitHub branch: Driver_App
echo.
pause
