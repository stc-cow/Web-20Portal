import { supabase } from './supabase';

export interface DriverSession {
  id: string;
  email: string;
  name: string;
  phone?: string;
  assigned_site?: string;
  avatar_url?: string;
  access_token: string;
}

const DRIVER_SESSION_KEY = 'driver_session';
const DRIVER_TOKEN_KEY = 'driver_token';

// Lazy load Capacitor Preferences if available
let PreferencesModule: typeof import('@capacitor/preferences') | null = null;

const loadPreferences = async () => {
  if (PreferencesModule) return PreferencesModule;
  try {
    PreferencesModule = await import('@capacitor/preferences');
    return PreferencesModule;
  } catch {
    return null;
  }
};

export const driverAuth = {
  async signIn(email: string, password: string): Promise<DriverSession> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id, name, phone, assigned_site, avatar_url')
        .eq('email', email)
        .single();

      if (driverError) {
        console.warn('Driver profile fetch error:', driverError);
      }

      const session: DriverSession = {
        id: data.user.id,
        email: data.user.email || email,
        name: driverData?.name || email.split('@')[0],
        phone: driverData?.phone,
        assigned_site: driverData?.assigned_site,
        avatar_url: driverData?.avatar_url,
        access_token: data.session?.access_token || '',
      };

      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Driver sign in error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await this.clearSession();
    } catch (error) {
      console.error('Driver sign out error:', error);
      throw error;
    }
  },

  async saveSession(session: DriverSession): Promise<void> {
    try {
      const storageMethod = this.getStorageMethod();
      const sessionData = JSON.stringify(session);

      if (storageMethod === 'capacitor') {
        const Preferences = await loadPreferences();
        if (Preferences) {
          await Preferences.Preferences.set({
            key: DRIVER_SESSION_KEY,
            value: sessionData,
          });
        } else {
          localStorage.setItem(DRIVER_SESSION_KEY, sessionData);
        }
      } else {
        localStorage.setItem(DRIVER_SESSION_KEY, sessionData);
      }
    } catch (error) {
      console.warn('Failed to save driver session:', error);
    }
  },

  async getSession(): Promise<DriverSession | null> {
    try {
      const storageMethod = this.getStorageMethod();
      let sessionData: string | null = null;

      if (storageMethod === 'capacitor') {
        const Preferences = await loadPreferences();
        if (Preferences) {
          const { value } = await Preferences.Preferences.get({
            key: DRIVER_SESSION_KEY,
          });
          sessionData = value;
        } else {
          sessionData = localStorage.getItem(DRIVER_SESSION_KEY);
        }
      } else {
        sessionData = localStorage.getItem(DRIVER_SESSION_KEY);
      }

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData) as DriverSession;
      return session;
    } catch (error) {
      console.warn('Failed to retrieve driver session:', error);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      const storageMethod = this.getStorageMethod();

      if (storageMethod === 'capacitor') {
        const Preferences = await loadPreferences();
        if (Preferences) {
          await Preferences.Preferences.remove({
            key: DRIVER_SESSION_KEY,
          });
        } else {
          localStorage.removeItem(DRIVER_SESSION_KEY);
        }
      } else {
        localStorage.removeItem(DRIVER_SESSION_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear driver session:', error);
    }
  },

  async saveFCMToken(token: string, driverId: string): Promise<void> {
    try {
      await supabase.from('driver_push_tokens').upsert({
        driver_id: driverId,
        token,
        platform: this.getPlatform(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to save FCM token:', error);
    }
  },

  private getStorageMethod(): 'capacitor' | 'localStorage' {
    if (typeof window !== 'undefined' && (window as any).cordova) {
      return 'capacitor';
    }
    return 'localStorage';
  },

  private getPlatform(): 'web' | 'ios' | 'android' {
    const capacitor = (window as any).Capacitor;
    if (!capacitor) return 'web';

    const platform = capacitor.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'web';
  },
};

export async function setupDriverRealtime(driverId: string, onUpdate: () => void) {
  if (typeof (supabase as any).channel !== 'function') {
    return null;
  }

  const channel = (supabase as any)
    .channel(`driver-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'driver_tasks',
        filter: `driver_id=eq.${driverId}`,
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${driverId}`,
      },
      () => onUpdate()
    )
    .subscribe();

  return channel;
}
