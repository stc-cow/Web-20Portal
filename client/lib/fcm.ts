import { driverAuth } from './driverAuth';

interface FCMConfig {
  vapidKey?: string;
  serviceWorkerPath?: string;
}

// Lazy load Capacitor if available
const loadCapacitor = async () => {
  try {
    return (window as any).Capacitor;
  } catch {
    return null;
  }
};

export class FCMManager {
  private config: FCMConfig;
  private tokenRefreshInterval: NodeJS.Timeout | null = null;

  constructor(config: FCMConfig = {}) {
    this.config = config;
  }

  async initializeFCM(): Promise<void> {
    if (!this.isPushNotificationsSupported()) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      await this.registerServiceWorker();
      await this.requestNotificationPermission();
      await this.setupTokenRefresh();
    } catch (error) {
      console.warn('FCM initialization error:', error);
    }
  }

  private isPushNotificationsSupported(): boolean {
    if (typeof window === 'undefined') return false;

    const isCapacitor = !!(window as any).Capacitor;
    const isWeb = 'serviceWorker' in navigator && 'PushManager' in window;

    return isCapacitor || isWeb;
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const scriptPath = this.config.serviceWorkerPath || '/service-worker.js';
        await navigator.serviceWorker.register(scriptPath, {
          scope: '/',
        });
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async getOrCreateFCMToken(driverId: string): Promise<string | null> {
    try {
      const capacitor = (window as any).Capacitor;

      if (capacitor) {
        return await this.getCapacitorFCMToken(driverId);
      }

      return await this.getWebFCMToken(driverId);
    } catch (error) {
      console.warn('Failed to get FCM token:', error);
      return null;
    }
  }

  private async getCapacitorFCMToken(driverId: string): Promise<string | null> {
    try {
      const Capacitor = await loadCapacitor();
      if (!Capacitor) {
        console.warn('Capacitor not available');
        return null;
      }

      const FCM = (window as any).FCM;
      if (!FCM) {
        console.warn('FCM plugin not available');
        return null;
      }

      const token = await FCM.getToken();
      if (token) {
        await driverAuth.saveFCMToken(token, driverId);
      }
      return token;
    } catch (error) {
      console.warn('Failed to get Capacitor FCM token:', error);
      return null;
    }
  }

  private async getWebFCMToken(driverId: string): Promise<string | null> {
    try {
      const registration = await navigator.serviceWorker.ready;

      if (!('pushManager' in registration)) {
        console.warn('Push Manager not available');
        return null;
      }

      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const token = this.extractTokenFromSubscription(subscription);
        if (token) {
          await driverAuth.saveFCMToken(token, driverId);
        }
        return token;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.config.vapidKey,
      });

      const token = this.extractTokenFromSubscription(newSubscription);
      if (token) {
        await driverAuth.saveFCMToken(token, driverId);
      }

      return token;
    } catch (error) {
      console.warn('Failed to get Web FCM token:', error);
      return null;
    }
  }

  private extractTokenFromSubscription(
    subscription: PushSubscription
  ): string | null {
    try {
      const key = subscription.getKey('p256dh');
      if (key) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(key) as any));
      }
      return subscription.endpoint;
    } catch {
      return subscription.endpoint;
    }
  }

  private setupTokenRefresh(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    this.tokenRefreshInterval = setInterval(async () => {
      try {
        const session = await driverAuth.getSession();
        if (session) {
          await this.getOrCreateFCMToken(session.id);
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  async handleNotificationMessage(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      const permission = await this.requestNotificationPermission();

      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: 'https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2Fdab107460bc24c05b37400810c2b1332?format=webp&width=800',
          badge: 'https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2Fdab107460bc24c05b37400810c2b1332?format=webp&width=800',
          ...options,
        });
      }
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  destroy(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }
}

export const fcmManager = new FCMManager({
  serviceWorkerPath: '/service-worker.js',
});
