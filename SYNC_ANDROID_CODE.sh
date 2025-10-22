#!/bin/bash

# This script syncs the cleaned web code from code/client/ to Driver-20App/client/
# Run this BEFORE building the Android app in Android Studio
# Usage: bash code/SYNC_ANDROID_CODE.sh

echo "🔄 Syncing cleaned web code to Android project..."

# Remove old client code from Android project
echo "❌ Removing old code from Driver-20App/client..."
rm -rf ../Driver-20App/client/pages
rm -rf ../Driver-20App/client/components/builder 2>/dev/null || true
rm -rf ../Driver-20App/client/components/dashboard 2>/dev/null || true
rm -rf ../Driver-20App/client/components/layout 2>/dev/null || true
rm -rf ../Driver-20App/client/components/visual 2>/dev/null || true

# Remove all unused UI components (keep only essential ones)
echo "🗑️  Removing unused UI components..."
cd ../Driver-20App/client/components/ui 2>/dev/null || exit 1
rm -f accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx badge.tsx \
      breadcrumb.tsx calendar.tsx carousel.tsx chart.tsx checkbox.tsx collapsible.tsx \
      command.tsx context-menu.tsx drawer.tsx dropdown-menu.tsx form.tsx hover-card.tsx \
      input-otp.tsx menubar.tsx navigation-menu.tsx pagination.tsx popover.tsx progress.tsx \
      radio-group.tsx resizable.tsx scroll-area.tsx select.tsx separator.tsx sheet.tsx \
      sidebar.tsx skeleton.tsx slider.tsx switch.tsx table.tsx tabs.tsx toggle-group.tsx \
      toggle.tsx tooltip.tsx 2>/dev/null || true
cd ../../../../code

# Copy fresh pages and components from code/client
echo "📂 Copying fresh pages from code/client..."
cp -r client/pages ../Driver-20App/client/pages

echo "📂 Copying fresh UI components from code/client..."
cp -r client/components/ui/*.tsx ../Driver-20App/client/components/ui/ 2>/dev/null || true

# Copy essential utilities
echo "📂 Copying lib utilities..."
cp -r client/lib ../Driver-20App/client/lib 2>/dev/null || true

# Copy hooks
echo "📂 Copying hooks..."
cp -r client/hooks ../Driver-20App/client/hooks 2>/dev/null || true

# Copy styles
echo "🎨 Copying global styles..."
cp client/global.css ../Driver-20App/client/global.css 2>/dev/null || true
cp client/index.css ../Driver-20App/client/index.css 2>/dev/null || true

# Copy App.tsx
echo "📄 Copying App.tsx..."
cp client/App.tsx ../Driver-20App/client/App.tsx

# Copy vite-env.d.ts
echo "📄 Copying vite-env.d.ts..."
cp client/vite-env.d.ts ../Driver-20App/client/vite-env.d.ts 2>/dev/null || true

# Sync package.json dependencies
echo "📦 Syncing package.json..."
cp package.json ../Driver-20App/package.json

echo "✅ Sync complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd ../Driver-20App"
echo "2. pnpm install"
echo "3. Open Android Studio and open Driver-20App folder"
echo "4. Run: Build → Clean Project"
echo "5. Run: Build → Rebuild Project"
echo "6. Run: Run → Run 'App' (or Shift+F10)"
echo ""
echo "🎉 Your Android app will now show the new Material Design 3 driver app!"
