import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { driverAuth, DriverSession } from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export default function DriverNotifications() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSession = await driverAuth.getSession();
        if (!currentSession) {
          navigate('/driver/login');
          return;
        }
        setSession(currentSession);
        await loadNotifications(currentSession.id);
        setupRealtimeListener(currentSession.id);
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [navigate]);

  const loadNotifications = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
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
          loadNotifications(driverId);
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setIsDeleting(notificationId);
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast({ title: 'Notification deleted' });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: 'Failed to delete',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!session) return;

    setIsDeleting('all');
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .delete()
        .eq('driver_id', session.id);

      if (error) throw error;

      setNotifications([]);
      toast({ title: 'All notifications cleared' });
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast({
        title: 'Failed to clear notifications',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ read: true })
        .eq('driver_id', session.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: 'All notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Notifications</h1>
        <p className="text-xs text-gray-600">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>

        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex gap-2 mt-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting !== null}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 text-center text-sm">
                No notifications yet. You're all caught up!
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 transition-colors ${
                !notification.read
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                          notification.type === 'success'
                            ? 'bg-green-100 text-green-800'
                            : notification.type === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : notification.type === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {notification.type}
                      </span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => handleDelete(notification.id)}
                    disabled={isDeleting === notification.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs w-full"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
