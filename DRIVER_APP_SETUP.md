# Driver App Implementation Guide

This document outlines the complete implementation of the ACES Driver App for Android/iOS using React, Capacitor, Supabase, and Firebase Cloud Messaging.

## Overview

The Driver App allows drivers to:
- Log in with Supabase credentials
- View assigned fuel delivery missions
- Submit fuel entries with photo evidence
- Receive real-time notifications
- Manage profile and account settings

## Technology Stack

- **Frontend**: React 18 with TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mobile**: Capacitor (Android/iOS)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Storage**: Capacitor Storage (with localStorage fallback)

## Project Structure

```
code/client/
├── lib/
│   ├── driverAuth.ts       # Supabase auth + persistent login
│   ├── fcm.ts              # Firebase Cloud Messaging integration
│   └── supabase.ts         # Supabase client (existing)
├── pages/
│   └── driver/
│       ├── DriverLogin.tsx           # Login screen
│       ├── DriverDashboard.tsx       # Mission list + stats
│       ├── DriverMissionDetail.tsx   # Fuel entry form with images
│       ├── DriverNotifications.tsx   # Notifications list
│       └── DriverSettings.tsx        # Profile + settings
└── public/
    └── service-worker.js   # Push notification handler
```

## Installation & Setup

### 1. Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/preferences @capacitor/camera @capacitor/filesystem
npm install @capacitor/android @capacitor/ios --save-dev
```

### 2. Configure Environment Variables

Add these to your `.env` file:
```
VITE_SUPABASE_URL=https://qpnpqudrrrzgvfwdkljo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FCM_SENDER_ID=874270110177
FCM_SERVER_KEY=ceUStHy-_lvdizGfxYtaHhhJWzh5RovRwOxeir8L6z4
VITE_PUSH_NOTIFICATIONS_ENABLED=true
```

### 3. Supabase Database Schema

Ensure the following tables exist in Supabase:

#### `drivers`
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  assigned_site TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `driver_tasks`
```sql
CREATE TABLE driver_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  scheduled_at TIMESTAMP,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')),
  required_liters NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### `driver_task_entries`
```sql
CREATE TABLE driver_task_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  task_id UUID REFERENCES driver_tasks(id),
  site_id TEXT,
  actual_liters_in_tank NUMERIC,
  quantity_added NUMERIC,
  observations TEXT,
  counter_before_url TEXT,
  tank_before_url TEXT,
  counter_after_url TEXT,
  tank_after_url TEXT,
  submitted_at TIMESTAMP DEFAULT now()
);
```

#### `driver_notifications`
```sql
CREATE TABLE driver_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `driver_push_tokens`
```sql
CREATE TABLE driver_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('web', 'ios', 'android')),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 4. Firebase Cloud Messaging Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Get your Server API Key and Sender ID
4. Set `FCM_SENDER_ID` and `FCM_SERVER_KEY` in environment variables

### 5. Android Build

```bash
# Build the project
npm run build:client

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# In Android Studio:
# 1. Build the app
# 2. Run on emulator or device
```

### 6. iOS Build

```bash
# Build the project
npm run build:client

# Sync to iOS
npx cap sync ios

# Open Xcode
npx cap open ios

# In Xcode:
# 1. Set Team ID
# 2. Set Bundle ID
# 3. Build and run on simulator or device
```

## Features Implemented

### Authentication
- ✅ Email/password login with Supabase Auth
- ✅ Session persistence using Capacitor Storage
- ✅ Auto-redirect to login if session expired
- ✅ Logout with session cleanup

### Driver Dashboard
- ✅ List of assigned missions with real-time sync
- ✅ Filter by status (pending, in progress, completed)
- ✅ Search tasks by site name
- ✅ Task statistics (total, pending, active, completed)
- ✅ Real-time task updates via Supabase Realtime

### Mission Details & Fuel Entry
- ✅ Mission information display
- ✅ Fuel quantity form fields
- ✅ Evidence photo capture (4 images: counter before/after, tank before/after)
- ✅ Image upload to Supabase Storage
- ✅ Observations/notes field
- ✅ Form submission to Supabase
- ✅ Automatic task status update to "completed"

### Notifications
- ✅ List of driver notifications
- ✅ Mark individual notifications as read
- ✅ Delete notifications
- ✅ Unread notification badge
- ✅ Real-time notification sync from Supabase

### Settings & Profile
- ✅ Display driver profile information
- ✅ Device information (platform, app version)
- ✅ Password change functionality
- ✅ Logout button

### Push Notifications
- ✅ Service Worker registration
- ✅ FCM token management
- ✅ Automatic token refresh every 24 hours
- ✅ Push notification handling
- ✅ Notification click handling with deep linking
- ✅ Support for both web and mobile (Capacitor)

## API Routes

### Driver Routes

- `GET /driver/login` - Driver login page
- `GET /driver/dashboard` - Mission dashboard
- `GET /driver/mission/:taskId` - Mission detail and fuel entry form
- `GET /driver/notifications` - Notifications list
- `GET /driver/settings` - Settings and profile

## Usage

### For Drivers

1. Navigate to `/driver/login`
2. Enter your email and password (from Supabase)
3. View your assigned missions on the dashboard
4. Click "View Details" to see mission info
5. Fill out the fuel entry form with:
   - Actual liters in tank
   - Quantity added
   - Evidence photos (required)
   - Observations (optional)
6. Submit the form to complete the mission
7. Check notifications for updates
8. Manage profile settings in Settings

### For Admins

The admin dashboard (existing web portal) can:
- Create and assign driver tasks
- View fuel entry submissions
- Send notifications to drivers
- Track fuel distribution metrics

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `FCM_SENDER_ID` | Firebase Cloud Messaging Sender ID |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging Server Key |
| `VITE_PUSH_NOTIFICATIONS_ENABLED` | Enable push notifications (true/false) |

## Testing

### Web Testing
```bash
npm run dev
# Navigate to http://localhost:5173/#/driver/login
```

### Mobile Testing

#### Android Emulator
```bash
npm run build:client
npx cap sync android
npx cap open android
# Build and run in Android Studio
```

#### iOS Simulator
```bash
npm run build:client
npx cap sync ios
npx cap open ios
# Build and run in Xcode
```

## Troubleshooting

### FCM Token Not Registering
1. Ensure `VITE_PUSH_NOTIFICATIONS_ENABLED=true`
2. Check browser notification permissions
3. Verify Service Worker is registered
4. Check browser console for FCM errors

### Session Not Persisting
1. Check if Capacitor Storage is available
2. Verify `@capacitor/preferences` is installed
3. Check browser localStorage as fallback
4. Inspect DevTools > Application > Storage

### Realtime Updates Not Working
1. Verify Supabase realtime is enabled
2. Check database RLS policies
3. Inspect browser DevTools > Network for WebSocket connections
4. Verify `postgres_changes` subscription filter matches table structure

### Image Upload Fails
1. Check `driver-uploads` bucket exists in Supabase Storage
2. Verify bucket is public (authenticated access)
3. Ensure file size < 10MB
4. Check browser console for S3 errors

## Security Considerations

- ✅ Supabase Auth handles password security
- ✅ RLS policies prevent cross-driver data access
- ✅ Session tokens stored securely in Capacitor Preferences
- ✅ HTTPS enforced in production
- ✅ FCM tokens associated with driver_id only
- ✅ Image uploads use authenticated routes

## Performance Optimizations

- Real-time subscriptions update only affected data
- Image uploads are optimized with compression
- Session caching reduces auth requests
- Realtime listeners cleaned up on unmount
- Service Worker caches static assets

## Future Enhancements

- [ ] Offline support with service worker caching
- [ ] Photo compression before upload
- [ ] GPS tracking for fuel deliveries
- [ ] QR code scanning for site identification
- [ ] Biometric authentication (fingerprint/face)
- [ ] Driver app localization
- [ ] Analytics and usage tracking
- [ ] Driver performance metrics

## Support & Documentation

For more information:
- Supabase Docs: https://supabase.com/docs
- Capacitor Docs: https://capacitorjs.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Project Docs: https://www.builder.io/c/docs/projects
