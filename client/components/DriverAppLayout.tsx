import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabNavigation from '@/components/BottomTabNavigation';
import { driverAuth, DriverSession } from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';

interface DriverAppLayoutProps {
  children: React.ReactNode;
}

export default function DriverAppLayout({ children }: DriverAppLayoutProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSession = await driverAuth.getSession();
        if (!currentSession) {
          navigate('/driver/login');
          return;
        }
        setSession(currentSession);
        loadUnreadNotifications(currentSession.id);
        setupRealtimeListener(currentSession.id);
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      }
    };

    initializeSession();
  }, [navigate]);

  const loadUnreadNotifications = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_notifications')
        .select('id')
        .eq('driver_id', driverId)
        .eq('read', false);

      if (!error) {
        setUnreadNotifications((data || []).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const setupRealtimeListener = (driverId: string) => {
    if (typeof (supabase as any).channel !== 'function') {
      return;
    }

    const channel = (supabase as any)
      .channel(`notifications-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_notifications',
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          if (driverId) {
            loadUnreadNotifications(driverId);
          }
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BottomTabNavigation
      driverName={session.name}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </BottomTabNavigation>
  );
}
