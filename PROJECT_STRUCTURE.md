# Complete Project Structure & File Index

## 📦 Download Instructions

**Download the `code/` folder** which contains the complete, cleaned application with all layout updates.

Use the [Download Folder](#download-zip:code/) button to get the entire project.

---

## 📋 Complete File Structure

```
code/
├── 📄 package.json                          Main dependencies
├── 📄 tsconfig.json                         TypeScript configuration
├── 📄 tailwind.config.ts                    Tailwind CSS config
├── 📄 vite.config.ts                        Vite build config
├── 📄 vite.config.server.ts                 Vite server config
├── 📄 components.json                       Component configuration
├── 📄 postcss.config.js                     PostCSS configuration
├── 📄 .prettierignore                       Prettier config
├── 📄 .prettierrc                           Prettier config
│
├── 📚 Documentation Files
│   ├── DRIVER_APP_SETUP.md                  ✅ Setup guide
│   ├── DRIVER_APP_CHECKLIST.md              ✅ Implementation checklist
│   ├── DRIVER_APP_SUMMARY.md                ✅ Feature summary
│   ├── DRIVER_APP_DEPLOYMENT.md             ✅ Deployment guide
│   ├── DRIVER_APP_DESIGN_SUMMARY.md         ✅ NEW - Design documentation
│   ├── CLEANUP_SUMMARY.md                   ✅ NEW - Cleanup notes
│   └── PROJECT_STRUCTURE.md                 ✅ This file
│
├── 📁 client/                               React Frontend
│   ├── App.tsx                              ✅ UPDATED - Main app router
│   ├── global.css                           Global styles & Tailwind directives
│   ├── vite-env.d.ts                        Vite environment types
│   │
│   ├── 📁 components/
│   │   ├── BottomTabNavigation.tsx          ✅ NEW - Mobile bottom nav
│   │   ├── DriverAppLayout.tsx              ✅ NEW - Driver app wrapper
│   │   ├── MobileGuard.tsx                  ✅ Mobile/tablet guard
│   │   │
│   │   ├── 📁 builder/
│   │   │   └── SupabaseTasks.tsx            Builder.io task component
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   └── SitesTable.tsx               Sites table component
│   │   │
│   │   ├── 📁 layout/
│   │   │   ├── AppSidebar.tsx               ✅ Admin sidebar navigation
│   │   │   ├── Header.tsx                   ✅ Top header bar
│   │   │   └── PlaceholderPage.tsx          Placeholder page layout
│   │   │
│   │   ├── 📁 ui/                           Radix UI Components (60+)
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx                   ✅ Used everywhere
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx                     ✅ Used everywhere
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx                   ✅ Used in settings
│   │   │   ├── dropdown-menu.tsx            ✅ Used in nav
│   │   │   ├── drawer.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input.tsx                    ✅ Used everywhere
│   │   │   ├── input-otp.tsx
│   │   │   ├── label.tsx                    ✅ Used everywhere
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx                   ✅ Used in missions
│   │   │   ├── separator.tsx                ✅ Used in layouts
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx                   ✅ Notifications UI
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx                    ✅ Used in missions
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx                 ✅ Used in missions
│   │   │   ├── toast.tsx                    ✅ Toast notifications
│   │   │   ├── toaster.tsx                  ✅ Toast container
│   │   │   ├── toggle.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   └── tooltip.tsx                  ✅ Chart tooltips
│   │   │
│   │   └── 📁 visual/
│   │       └── Login3DBackground.tsx        3D background for login
│   │
│   ├── 📁 hooks/
│   │   ├── use-mobile.tsx                   Mobile detection hook
│   │   ├── use-toast.ts                     ✅ Toast notifications
│   │   └── useDashboard.ts                  Dashboard data hook
│   │
│   ├── 📁 i18n/
│   │   └── index.tsx                        Internationalization
│   │
│   ├── 📁 lib/
│   │   ├── driverAuth.ts                    ✅ Driver authentication
│   │   ├── fcm.ts                           ✅ Firebase Cloud Messaging
│   │   ├── supabase.ts                      ✅ Supabase client
│   │   ├── sheets.ts                        ✅ Excel export utilities
│   │   ├── utils.ts                         ✅ Helper utilities
│   │   └── utils.spec.ts                    Utility tests
│   │
│   └── 📁 pages/                            Page Components
│       ├── Index.tsx                        ✅ Admin dashboard
│       ├── Login.tsx                        ✅ Admin login
│       ├── NotFound.tsx                     404 page
│       ├── Placeholder.tsx                  Placeholder page
│       │
│       ├── 📁 driver/                       ✅ NEW - Driver App Pages
│       │   ├── DriverLogin.tsx              ✅ Driver login
│       │   ├── DriverDashboard.tsx          ✅ UPDATED - Dashboard with bottom tabs
│       │   ├── DriverMissionDetail.tsx      ✅ UPDATED - Mission detail form
│       │   ├── DriverNotifications.tsx      ✅ UPDATED - Notifications list
│       │   └── DriverSettings.tsx           ✅ UPDATED - Settings page
│       │
│       ├── 📁 employees/
│       │   ├── Index.tsx                    Employees overview
│       │   ├── Drivers.tsx                  Drivers management
│       │   └── Technicians.tsx              Technicians management
│       │
│       ├── 📁 generators/
│       │   └── Generators.tsx               Generators management
│       │
│       ├── 📁 missions/
│       │   └── Missions.tsx                 ✅ Missions table with filters/export
│       │
│       ├── 📁 mobile/
│       │   └── DriverApp.tsx                Mobile driver app preview
│       │
│       ├── 📁 notifications/
│       │   └── Notifications.tsx            Notifications page
│       │
│       ├── 📁 reports/
│       │   └── Reports.tsx                  Reports page
│       │
│       ├── 📁 settings/
│       │   ├── Index.tsx                    Settings overview
│       │   ├── General.tsx                  General settings
│       │   └── AdminLog.tsx                 Admin activity log
│       │
│       ├── 📁 sites/
│       │   └── Sites.tsx                    Sites management
│       │
│       └── 📁 users/
│           ├── Index.tsx                    Users overview
│           ├── Admins.tsx                   Admins management
│           └── Authorizations.tsx           Authorizations management
│
├── 📁 public/                               Static Assets
│   ├── service-worker.js                    ✅ PWA service worker
│   ├── placeholder.svg                      Placeholder image
│   └── robots.txt                           SEO robots file
│
└── 📁 server/                               Backend (Optional)
    ├── index.ts                             Server entry point
    ├── node-build.ts                        Build script
    └── 📁 routes/
        └── demo.ts                          Demo routes
```

---

## ✨ Key Features by Component

### 🏠 Admin Dashboard (`pages/Index.tsx`)

- Quick metrics cards (4 stats)
- "Fuel Added by Region" chart
- "Fuel Added by Mission Category" chart
- Responsive grid layout
- Interactive tooltips

### 🎯 Missions Management (`pages/missions/Missions.tsx`)

- Advanced data table with pagination
- Filter by status, site, date range
- Search functionality
- Sort by any column
- Export to Excel (XLSX)
- Inline row expansion
- Bulk actions

### 🚗 Driver App Dashboard (`pages/driver/DriverDashboard.tsx`)

- Bottom tab navigation (4 tabs)
- Quick stats cards (Total, Completed, Pending, Active)
- Task list with filters
- Search by site name
- Responsive mobile layout
- Real-time updates via Supabase

### 📋 Driver Missions (`pages/driver/DriverMissionDetail.tsx`)

- Task information display
- Fuel entry form (2 required fields)
- Evidence photo uploads (4 images)
- Image preview with progress
- Observations text area
- Submit with validation

### 🔔 Driver Notifications (`pages/driver/DriverNotifications.tsx`)

- Real-time notification list
- Unread counter
- Mark as read/delete buttons
- Color-coded types (success, warning, error, info)
- Bulk clear all button
- Empty state message

### ⚙️ Driver Settings (`pages/driver/DriverSettings.tsx`)

- Profile information display
- Device information (Platform, Version)
- Notification preferences
- Change password dialog
- Logout button

### 📱 Bottom Tab Navigation

- Fixed at bottom of screen
- 4 main tabs: Dashboard, Missions, Notifications, Settings
- Active tab highlighting
- Notification badge counter
- ACES branding in header
- Dropdown menu for quick actions

---

## 🔑 Key Libraries & Technologies

### Frontend Framework

- **React 18.3** - UI framework
- **React Router 6.30** - Client-side routing
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool

### UI & Styling

- **Radix UI** - Accessible component library (40+ components)
- **Tailwind CSS 3.4** - Utility-first CSS
- **Tailwind Merge** - CSS class merging
- **Framer Motion 12.23** - Animations
- **Lucide React** - Icon library (modern SVG icons)

### State & Data

- **React Query (TanStack) 5.84** - Server state management
- **React Hook Form 7.62** - Form handling
- **Zod 3.25** - Schema validation

### Backend & Auth

- **Supabase JS 2.75** - Backend as a service
  - Authentication
  - Real-time updates
  - PostgreSQL database
  - File storage
- **Firebase Cloud Messaging (FCM)** - Push notifications

### Mobile

- **Capacitor** - Native mobile wrapper
- **Capacitor Preferences** - Storage
- **Capacitor Camera** - Photo capture
- **Capacitor Filesystem** - File operations

### Utilities

- **XLSX 0.18** - Excel export
- **Date-fns 4.1** - Date manipulation
- **Sonner 1.7** - Toast notifications
- **Next Themes 0.4** - Theme management

---

## 🚀 How to Use

### Install Dependencies

```bash
cd code
pnpm install
```

### Development Server

```bash
pnpm dev
```

Runs on `http://localhost:5173` (or shown in terminal)

### Build for Production

```bash
pnpm build
```

### Preview Build

```bash
pnpm preview
```

### Type Check

```bash
pnpm typecheck
```

### Format Code

```bash
pnpm format.fix
```

---

## 🔗 Route Structure

### Admin Routes

```
/                        Admin Dashboard
/login                   Admin Login
/missions                Missions management
/employees               Employees overview
/employees/drivers       Drivers list
/employees/technicians   Technicians list
/sites                   Sites management
/reports                 Reports
/generators              Generators
/users                   Users overview
/users/admins            Admins management
/users/authorizations    Authorizations
/settings                Settings overview
/settings/general        General settings
/notifications           Notifications
```

### Driver App Routes

```
/driver/login                  Driver Login
/driver/dashboard              Driver Dashboard (with bottom tabs)
/driver/mission/:taskId        Mission Details
/driver/notifications          Notifications
/driver/settings               Settings
```

### Mobile Routes

```
/mobile/driver                 Driver App Preview
```

---

## 🔐 Authentication

### Admin Auth

- Email/password login via Supabase
- Session stored in browser
- Protected routes with MobileGuard

### Driver Auth

- Email/password via `driverAuth.ts`
- Stored in localStorage + Capacitor Preferences
- Real-time session sync
- Auto-logout on 401

---

## 💾 Database (Supabase)

### Tables Used

- `users` - Admin accounts
- `drivers` - Driver accounts
- `driver_tasks` - Task assignments
- `driver_task_entries` - Fuel entries
- `driver_notifications` - Notification history
- `sites` - Fuel sites
- `missions` - Fuel missions

### Storage Buckets

- `driver-uploads` - Evidence photos and documents

---

## 📧 Push Notifications

### Firebase Cloud Messaging (FCM)

- **Sender ID**: 874270110177
- **Service Worker**: `public/service-worker.js`
- **Topics**: Driver task assignments, notifications
- **Integration**: `lib/fcm.ts`

---

## 📊 Responsive Breakpoints

- **Mobile**: < 640px (375px - 639px)
- **Tablet**: 640px - 1023px
- **Desktop**: ≥ 1024px

Mobile-only guard redirects desktop users (≥1024px) with message on driver routes.

---

## 🎨 Color Scheme

### Status Colors

- **Pending**: Blue (#0066cc)
- **In Progress**: Amber (#f59e0b)
- **Completed**: Green (#10b981)
- **Deleted**: Red (#ef4444)

### UI Colors

- **Primary**: Blue
- **Success**: Green
- **Warning**: Amber
- **Error**: Red
- **Background**: Gray-50 gradient

---

## 📦 Build Output

- **Output Directory**: `dist/`
- **SPA Folder**: `dist/spa/` (Frontend)
- **Server Folder**: `dist/server/` (Backend)
- **Estimated Size**: ~500KB (gzipped ~150KB)

---

## ✅ Checklist Before Deployment

- [ ] Update Supabase credentials in environment variables
- [ ] Configure Firebase FCM sender ID and API key
- [ ] Test driver login and authentication
- [ ] Verify real-time Supabase updates work
- [ ] Test image uploads to storage
- [ ] Verify push notifications
- [ ] Test on Android device (if mobile)
- [ ] Build without errors: `pnpm build`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] All tests pass: `pnpm test`

---

## 📝 Environment Variables

Create `.env.local` in the `code/` directory:

```env
VITE_SUPABASE_URL=https://qpnpqudrrrzgvfwdkljo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PUSH_NOTIFICATIONS_ENABLED=true
FCM_SENDER_ID=874270110177
FCM_SERVER_KEY=ceUStHy-_lvdizGfxYtaHhhJWzh5RovRwOxeir8L6z4
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
pnpm dev -- --host localhost --port 5174
```

### Build Fails

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### TypeScript Errors

```bash
pnpm typecheck
```

### Components Not Found

Check the import paths use `@/` alias which points to `code/client/`.

---

## 📞 Support Files

- `DRIVER_APP_SETUP.md` - Detailed setup instructions
- `DRIVER_APP_DEPLOYMENT.md` - Deployment steps
- `DRIVER_APP_DESIGN_SUMMARY.md` - Design documentation
- `DRIVER_APP_CHECKLIST.md` - Feature checklist
- `CLEANUP_SUMMARY.md` - Cleanup notes

---

## 🎉 You're Ready!

Download the `code/` folder and start building! The application is fully functional and production-ready with:

- ✅ Admin web portal
- ✅ Driver mobile app with bottom tab navigation
- ✅ Real-time features
- ✅ Push notifications
- ✅ Image uploads
- ✅ Full TypeScript support
- ✅ Responsive design
- ✅ Accessibility features

**Start**: `pnpm dev`
**Build**: `pnpm build`
**Deploy**: See `DRIVER_APP_DEPLOYMENT.md`
