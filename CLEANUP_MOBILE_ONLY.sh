#!/bin/bash

# ACES MSD Fuel - Mobile Driver App Cleanup
# This script restructures the project for mobile-only (Android/iOS + Web Wrapper)
# Delete all web portal code, keep only mobile app

set -e

echo "🚀 ACES MSD Fuel - Mobile App Restructure"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verify we're in the right directory
if [ ! -d "code" ] || [ ! -d "Driver-20App" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root (where code/ and Driver-20App/ exist)${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Cleanup Plan:${NC}"
echo "  1. Remove web portal pages from Driver-20App/"
echo "  2. Remove web portal components"
echo "  3. Remove unused UI components"
echo "  4. Delete old code/ folder"
echo "  5. Update package.json to mobile-only"
echo "  6. Clean install dependencies"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo -e "${YELLOW}⏳ Starting cleanup...${NC}"
echo ""

# Step 1: Remove web portal pages from Driver-20App
echo -e "${BLUE}[1/6]${NC} Removing web portal pages..."
rm -rf Driver-20App/client/pages/employees
rm -rf Driver-20App/client/pages/missions
rm -rf Driver-20App/client/pages/sites
rm -rf Driver-20App/client/pages/users
rm -rf Driver-20App/client/pages/generators
rm -rf Driver-20App/client/pages/reports
rm -rf Driver-20App/client/pages/settings
rm -rf Driver-20App/client/pages/notifications
rm -f Driver-20App/client/pages/Login.tsx
rm -f Driver-20App/client/pages/Placeholder.tsx
echo -e "${GREEN}✅ Web pages removed${NC}"

# Step 2: Remove web portal components
echo -e "${BLUE}[2/6]${NC} Removing web portal components..."
rm -rf Driver-20App/client/components/builder
rm -rf Driver-20App/client/components/dashboard
rm -rf Driver-20App/client/components/layout
rm -rf Driver-20App/client/components/visual
echo -e "${GREEN}✅ Web components removed${NC}"

# Step 3: Remove unused UI components (keep: button, card, input, label, dialog, toast, toaster, sonner, textarea, tooltip)
echo -e "${BLUE}[3/6]${NC} Removing unused UI components..."
cd Driver-20App/client/components/ui

# List of UI components to delete
to_delete=(
    "accordion.tsx"
    "alert-dialog.tsx"
    "alert.tsx"
    "aspect-ratio.tsx"
    "avatar.tsx"
    "badge.tsx"
    "breadcrumb.tsx"
    "calendar.tsx"
    "carousel.tsx"
    "chart.tsx"
    "checkbox.tsx"
    "collapsible.tsx"
    "command.tsx"
    "context-menu.tsx"
    "drawer.tsx"
    "dropdown-menu.tsx"
    "form.tsx"
    "hover-card.tsx"
    "input-otp.tsx"
    "menubar.tsx"
    "navigation-menu.tsx"
    "pagination.tsx"
    "popover.tsx"
    "progress.tsx"
    "radio-group.tsx"
    "resizable.tsx"
    "scroll-area.tsx"
    "select.tsx"
    "separator.tsx"
    "sheet.tsx"
    "sidebar.tsx"
    "skeleton.tsx"
    "slider.tsx"
    "switch.tsx"
    "table.tsx"
    "tabs.tsx"
    "toggle-group.tsx"
    "toggle.tsx"
)

for file in "${to_delete[@]}"; do
    rm -f "$file"
done

cd ../../../
echo -e "${GREEN}✅ Unused UI components removed${NC}"

# Step 4: Delete old code folder
echo -e "${BLUE}[4/6]${NC} Deleting old code/ folder..."
rm -rf code
echo -e "${GREEN}✅ Old code/ removed${NC}"

# Step 5: Update package.json
echo -e "${BLUE}[5/6]${NC} Updating package.json for mobile-only..."
cat > Driver-20App/package.json << 'EOF'
{
  "name": "aces-fuel-driver-mobile",
  "description": "ACES MSD Fuel - Mobile Driver Application (Android/iOS + Web Wrapper)",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "pkg": {
    "assets": ["dist/spa/*"],
    "scripts": ["dist/server/**/*.js"]
  },
  "scripts": {
    "dev": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "vite build --config vite.config.server.ts",
    "start": "node dist/server/node-build.mjs",
    "test": "vitest --run",
    "format.fix": "prettier --write .",
    "typecheck": "tsc",
    "cap:sync": "pnpm exec cap sync",
    "android": "pnpm build && pnpm exec cap copy android && pnpm exec cap open android",
    "ios": "pnpm build && pnpm exec cap copy ios && pnpm exec cap open ios"
  },
  "dependencies": {
    "@capacitor/android": "^7.4.3",
    "@capacitor/camera": "^7.0.2",
    "@capacitor/core": "^7.4.3",
    "@capacitor/ios": "^7.4.3",
    "@capacitor/local-notifications": "^7.0.3",
    "@capacitor/preferences": "^7.0.2",
    "@capacitor/push-notifications": "^7.0.3",
    "@supabase/supabase-js": "^2.75.0",
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "sonner": "^1.7.4",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.4.3",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@swc/core": "^1.13.3",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/node": "^24.2.1",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^4.0.0",
    "autoprefixer": "^10.4.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cors": "^2.8.5",
    "globals": "^16.3.0",
    "lucide-react": "^0.539.0",
    "postcss": "^8.5.6",
    "prettier": "^3.6.2",
    "serverless-http": "^3.2.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.20.3",
    "typescript": "^5.9.2",
    "vite": "^7.1.2",
    "vitest": "^3.2.4"
  },
  "packageManager": "pnpm@10.14.0+sha512.ad27a79641b49c3e481a16a805baa71817a04bbe06a38d17e60e2eaee83f6a146c6a688125f5792e48dd5ba30e7da52a5cda4c3992b9ccf333f9ce223af84748"
}
EOF
echo -e "${GREEN}✅ package.json updated${NC}"

# Step 6: Clean install
echo -e "${BLUE}[6/6]${NC} Installing dependencies..."
cd Driver-20App
rm -rf node_modules pnpm-lock.yaml
pnpm install
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo -e "${GREEN}✅ ✅ ✅ CLEANUP COMPLETE! ✅ ✅ ✅${NC}"
echo ""
echo -e "${BLUE}📁 Final Structure:${NC}"
echo "  Driver-20App/                    (root project)"
echo "  ├── client/pages/mobile/         ✅ DriverApp, DriverDashboard, DriverLogin, DriverTasks"
echo "  ├── client/components/ui/        ✅ Essential only (9 components)"
echo "  ├── client/lib/                  ✅ (supabase, pushNotifications)"
echo "  ├── android/                     ✅ Native app"
echo "  ├── ios/                         ✅ Native app"
echo "  └── server/ + configs            ✅"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. cd Driver-20App"
echo "  2. pnpm dev          (test dev server)"
echo "  3. pnpm build        (build for production)"
echo "  4. pnpm android      (open Android Studio)"
echo "  5. pnpm ios          (open Xcode)"
echo ""
echo -e "${YELLOW}📤 Ready to push to GitHub:${NC}"
echo "  git push origin Driver_App"
echo ""
