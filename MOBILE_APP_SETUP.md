# ACES MSD Fuel Driver - Mobile App Restructure

## Strategy
1. **Delete** `code/` folder (consolidating into Driver-20App)
2. **Clean** `Driver-20App/` - remove all web portal code
3. **Optimize** dependencies - keep only mobile essentials
4. **Deploy** final mobile-only project with Android + iOS

## Cleanup Commands

### Remove Web Pages
```bash
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
```

### Remove Web Components
```bash
rm -rf Driver-20App/client/components/builder
rm -rf Driver-20App/client/components/dashboard
rm -rf Driver-20App/client/components/layout
rm -rf Driver-20App/client/components/visual
```

### Remove Unused UI Components (Keep: button, card, input, label, dialog, toast, toaster, sonner, textarea, tooltip)
```bash
cd Driver-20App/client/components/ui && \
rm -f accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx badge.tsx \
breadcrumb.tsx calendar.tsx carousel.tsx chart.tsx checkbox.tsx collapsible.tsx \
command.tsx context-menu.tsx drawer.tsx dropdown-menu.tsx form.tsx hover-card.tsx \
input-otp.tsx menubar.tsx navigation-menu.tsx pagination.tsx popover.tsx progress.tsx \
radio-group.tsx resizable.tsx scroll-area.tsx select.tsx separator.tsx sheet.tsx \
sidebar.tsx skeleton.tsx slider.tsx switch.tsx table.tsx tabs.tsx toggle-group.tsx \
toggle.tsx
```

### Delete Old Code Folder
```bash
rm -rf code
```

### Clean Install
```bash
cd Driver-20App
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Updated package.json (Replace Driver-20App/package.json)

Dependencies to REMOVE from current package.json:
- @react-three/* (3D)
- framer-motion (animations)
- embla-carousel-react (carousel)
- cmdk (command)
- recharts (charts)
- @builder.io/react (builder)
- react-hook-form (forms)
- @tanstack/react-query (query)
- react-day-picker (date)
- next-themes (theme)
- date-fns (dates)
- input-otp (OTP)
- react-resizable-panels (panels)
- vaul (drawer)
- Unused @radix-ui/* components

Minimal package.json with only essentials:
```json
{
  "name": "aces-fuel-driver-mobile",
  "description": "ACES MSD Fuel - Mobile Driver App (Android/iOS + Web)",
  "version": "1.0.0",
  "private": true,
  "type": "module",
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
```

## Final Structure
```
Driver-20App/                      (rename to aces-fuel-driver-mobile)
├── client/
│   ├── pages/mobile/              ✅ DriverApp, DriverDashboard, DriverLogin, DriverTasks
│   ├── pages/Index.tsx            ✅ Redirects to /driver-login
│   ├── pages/NotFound.tsx         ✅
│   ├── components/ui/             ✅ Essential only (button, card, input, label, dialog, toast, toaster, sonner, textarea)
│   ├── components/mobile/         ✅
│   ├── lib/                       ✅ (supabase, pushNotifications, utils)
│   ├── hooks/                     ✅
│   ├── i18n/                      ✅
│   ├── App.tsx                    ✅
│   └── ...styles
├── android/                       ✅ Native code
├── ios/                           ✅ Native code
├── server/                        ✅
├── shared/                        ✅
├── public/                        ✅
└── config files (.ts, .json)     ✅
```

## Next Steps
1. Execute cleanup commands above on your machine
2. Replace package.json with minimal version
3. Run `pnpm install`
4. Test: `pnpm dev`
5. Push to GitHub branch `Driver_App`

---
**Ready for execution. User to run cleanup commands locally.**
