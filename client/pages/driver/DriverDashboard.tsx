import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { driverAuth, setupDriverRealtime, DriverSession } from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Bell, LogOut, Settings, RefreshCw } from 'lucide-react';

interface DriverTask {
  id: string;
  site_id: string;
  site_name: string;
  scheduled_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  required_liters: number;
  notes?: string;
  created_at: string;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<DriverTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
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
        await loadTasks(currentSession.id);
        loadUnreadNotifications(currentSession.id);
        setupRealtimeListeners(currentSession.id);
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [navigate]);

  const loadTasks = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_tasks')
        .select('*')
        .eq('driver_id', driverId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

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

  const setupRealtimeListeners = (driverId: string) => {
    const channel = setupDriverRealtime(driverId, async () => {
      await loadTasks(driverId);
      await loadUnreadNotifications(driverId);
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  };

  useEffect(() => {
    let filtered = tasks;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.site_name?.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  const handleLogout = async () => {
    try {
      await driverAuth.signOut();
      toast({ title: 'Logged out successfully' });
      navigate('/driver/login');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    if (session) {
      await loadTasks(session.id);
      await loadUnreadNotifications(session.id);
      toast({ title: 'Tasks refreshed' });
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2Fdab107460bc24c05b37400810c2b1332?format=webp&width=800"
                alt="ACES"
                className="h-8 w-auto"
              />
              <div>
                <h1 className="font-semibold text-gray-900">Driver Dashboard</h1>
                <p className="text-sm text-gray-600">{session?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="relative"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/driver/notifications')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/driver/settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-gray-900">
                {stats.total}
              </div>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-blue-600">
                {stats.pending}
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-amber-600">
                {stats.inProgress}
              </div>
              <p className="text-sm text-gray-600">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-green-600">
                {stats.completed}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search tasks by site name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-xs"
          />
          <div className="flex gap-2">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'in_progress'
                      ? 'Active'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {task.site_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(task.scheduled_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Required: <span className="font-medium">{task.required_liters}L</span>
                      </p>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          task.status === 'pending'
                            ? 'bg-blue-100 text-blue-800'
                            : task.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.status === 'in_progress' ? 'Active' : task.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/driver/mission/${task.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
