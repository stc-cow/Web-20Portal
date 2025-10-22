import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  driverAuth,
  setupDriverRealtime,
  DriverSession,
} from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';
import { fcmManager } from '@/lib/fcm';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

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
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'in_progress' | 'completed'
  >('all');
  const [isLoading, setIsLoading] = useState(true);

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
        setupRealtimeListeners(currentSession.id);

        try {
          await fcmManager.initializeFCM();
          await fcmManager.getOrCreateFCMToken(currentSession.id);
        } catch (error) {
          console.warn('FCM initialization failed:', error);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    return () => {
      fcmManager.destroy();
    };
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

  const setupRealtimeListeners = (driverId: string) => {
    const channel = setupDriverRealtime(driverId, async () => {
      await loadTasks(driverId);
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
          t.notes?.toLowerCase().includes(query),
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

  const handleRefresh = async () => {
    if (session) {
      await loadTasks(session.id);
      toast({ title: 'Tasks refreshed' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-10 w-10"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-xs text-gray-600 mt-1">Total Tasks</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
          <p className="text-xs text-gray-600 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {stats.pending}
          </div>
          <p className="text-xs text-gray-600 mt-1">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">
            {stats.inProgress}
          </div>
          <p className="text-xs text-gray-600 mt-1">Active</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="px-4 py-3 space-y-3">
        <Input
          placeholder="Search by site..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="whitespace-nowrap text-xs"
              >
                {status === 'all'
                  ? 'All'
                  : status === 'in_progress'
                    ? 'Active'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 py-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 text-center text-sm">
                No tasks found
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => navigate(`/driver/mission/${task.id}`)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex-1">
                      {task.site_name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                        task.status === 'pending'
                          ? 'bg-blue-100 text-blue-800'
                          : task.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {task.status === 'in_progress' ? 'Active' : task.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600">
                    {new Date(task.scheduled_at).toLocaleDateString()} at{' '}
                    {new Date(task.scheduled_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-600">
                      Required: <span className="font-medium">{task.required_liters}L</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/driver/mission/${task.id}`);
                      }}
                    >
                      View Details →
                    </Button>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-gray-600 pt-2 border-t border-gray-100">
                      <span className="font-medium">Notes:</span> {task.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
