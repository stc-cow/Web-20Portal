# Mobile App Restructure - Complete Merge Plan

## Overview

Merge `code/` (web) and `Driver-20App/` (native) into single mobile-only codebase.

## Strategy: Use Driver-20App as Base

- ✅ Has Capacitor for Android/iOS
- ✅ Already has mobile pages (DriverApp, DriverDashboard, etc.)
- ✅ Better dependencies for native

## Deletion Plan

### Web Portal Pages (DELETE from Driver-20App/client/pages/)

```
rm -rf client/pages/employees
rm -rf client/pages/missions
rm -rf client/pages/sites
rm -rf client/pages/users
rm -rf client/pages/generators
rm -rf client/pages/reports
rm -rf client/pages/settings
rm -rf client/pages/notifications
rm -f client/pages/Login.tsx
rm -f client/pages/Placeholder.tsx
```

### Web Portal Components (DELETE from Driver-20App/client/components/)

```
rm -rf client/components/builder
rm -rf client/components/dashboard
rm -rf client/components/layout
rm -rf client/components/visual
```

### Unused UI Components (DELETE)

Keep: button, card, input, label, dialog, toast, toaster, sonner, textarea

Delete: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, toggle-group, toggle, tooltip

### Final Structure

```
Driver-20App/
├── src/client/             (web wrapper UI)
│   ├── pages/
│   │   ├── mobile/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── ui/             (essential only)
│   │   └── mobile/
│   ├── lib/
│   ├── hooks/
│   └── App.tsx
├── android/                (native)
├── ios/                    (native)
├── package.json           (mobile-only)
└── ...configs
```

## Status

Ready to clean. User needs to execute cleanup locally or confirm automated cleanup.
