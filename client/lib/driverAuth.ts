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

class DriverAuth {
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
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await this.clearSession();
    } catch (error) {
      console.error('Driver sign out error:', error);
      throw error;
    }
  }

  async saveSession(session: DriverSession): Promise<void> {
    try {
      const storageMethod = this.getStorageMethod();
      const sessionData = JSON.stringify(session);

      if (storageMethod === 'capacitor') {
        await this.saveToCapacitorStorage(DRIVER_SESSION_KEY, sessionData);
      } else {
        localStorage.setItem(DRIVER_SESSION_KEY, sessionData);
      }
    } catch (error) {
      console.warn('Failed to save driver session:', error);
      try {
        localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session));
      } catch {}
    }
  }

  async getSession(): Promise<DriverSession | null> {
    try {
      const storageMethod = this.getStorageMethod();
      let sessionData: string | null = null;

      if (storageMethod === 'capacitor') {
        sessionData = await this.getFromCapacitorStorage(DRIVER_SESSION_KEY);
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
  }

  async clearSession(): Promise<void> {
    try {
      const storageMethod = this.getStorageMethod();

      if (storageMethod === 'capacitor') {
        await this.removeFromCapacitorStorage(DRIVER_SESSION_KEY);
      } else {
        localStorage.removeItem(DRIVER_SESSION_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear driver session:', error);
      try {
        localStorage.removeItem(DRIVER_SESSION_KEY);
      } catch {}
    }
  }

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
  }

  private async saveToCapacitorStorage(
    key: string,
    value: string,
  ): Promise<void> {
    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor) {
        throw new Error('Capacitor not available');
      }

      const { Preferences } = Capacitor.Plugins;
      if (!Preferences) {
        throw new Error('Preferences plugin not available');
      }

      await Preferences.set({ key, value });
    } catch (error) {
      console.warn('Capacitor storage unavailable, using localStorage:', error);
      localStorage.setItem(key, value);
    }
  }

  private async getFromCapacitorStorage(key: string): Promise<string | null> {
    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor) {
        throw new Error('Capacitor not available');
      }

      const { Preferences } = Capacitor.Plugins;
      if (!Preferences) {
        throw new Error('Preferences plugin not available');
      }

      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.warn('Capacitor storage unavailable, using localStorage:', error);
      return localStorage.getItem(key);
    }
  }

  private async removeFromCapacitorStorage(key: string): Promise<void> {
    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor) {
        throw new Error('Capacitor not available');
      }

      const { Preferences } = Capacitor.Plugins;
      if (!Preferences) {
        throw new Error('Preferences plugin not available');
      }

      await Preferences.remove({ key });
    } catch (error) {
      console.warn('Capacitor storage unavailable, using localStorage:', error);
      localStorage.removeItem(key);
    }
  }

  private getStorageMethod(): 'capacitor' | 'localStorage' {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return 'capacitor';
    }
    return 'localStorage';
  }

  private getPlatform(): 'web' | 'ios' | 'android' {
    const capacitor = (window as any).Capacitor;
    if (!capacitor) return 'web';

    try {
      const platform = capacitor.getPlatform();
      if (platform === 'ios') return 'ios';
      if (platform === 'android') return 'android';
    } catch {}

    return 'web';
  }
}

export const driverAuth = new DriverAuth();

export async function setupDriverRealtime(
  driverId: string,
  onUpdate: () => void,
) {
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
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${driverId}`,
      },
      () => onUpdate(),
    )
    .subscribe();

  return channel;
}
