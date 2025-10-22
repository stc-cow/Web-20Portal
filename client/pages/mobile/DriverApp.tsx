import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  LogOut,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Fuel,
  Navigation,
  ImageIcon,
  X,
  Clock,
  User,
  Home,
} from 'lucide-react';

export default function DriverApp() {
  const [profile, setProfile] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'active' | 'returned' | 'completed'
  >('active');
  const [editOpen, setEditOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [screen, setScreen] = useState<'home' | 'tasks' | 'detail'>('home');

  const [entry, setEntry] = useState({
    site_id: '',
    mission_id: '',
    actual_liters_in_tank: '',
    quantity_added: '',
    notes: '',
    counter_before_url: '',
    tank_before_url: '',
    counter_after_url: '',
    tank_after_url: '',
    tank_type: '',
    completed_at: '',
    vertical_calculated_liters: '',
    liters: '',
    rate: '',
    station: '',
    receipt: '',
    photo_url: '',
    odometer: '',
  });

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const DRIVER_BUCKET = 'driver-uploads';

  const keyMap = {
    counter_before: 'counter_before_url',
    tank_before: 'tank_before_url',
    counter_after: 'counter_after_url',
    tank_after: 'tank_after_url',
  } as const;

  const handleFile = useCallback(
    async (tag: keyof typeof keyMap, file: File) => {
      const k = keyMap[tag];
      if (file.size > 10 * 1024 * 1024) {
        alert('Max file size is 10MB');
        return;
      }
      setUploading((u) => ({ ...u, [tag]: true }));
      try {
        const dir = `${(profile?.name || 'driver').replace(/\s+/g, '_')}/${
          activeTask?.id || 'misc'
        }`;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${dir}/${tag}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from(DRIVER_BUCKET)
          .upload(path, file, {
            upsert: true,
            contentType: file.type || 'image/jpeg',
          });
        if (error) {
          alert(`Image upload failed: ${error.message}`);
          return;
        }
        const { data } = supabase.storage
          .from(DRIVER_BUCKET)
          .getPublicUrl(path);
        const url = data.publicUrl;
        setEntry((s: any) => ({ ...s, [k]: url }));
        setPreviews((prev) => ({ ...prev, [tag]: url }));
      } finally {
        setUploading((u) => ({ ...u, [tag]: false }));
      }
    },
    [DRIVER_BUCKET, activeTask?.id, profile?.name],
  );

  useEffect(() => {
    try {
      const getParams = () => {
        const search = window.location.search;
        if (search && search.length > 1) return new URLSearchParams(search);
        const hash = window.location.hash || '';
        const qIndex = hash.indexOf('?');
        if (qIndex >= 0) return new URLSearchParams(hash.substring(qIndex));
        return new URLSearchParams();
      };
      const params = getParams();
      const demo = params.get('demo') === '1';
      setDemoMode(demo);
      if (demo) {
        const demoProfile = { name: 'Demo Driver', phone: '0500000000' };
        setProfile(demoProfile);
        setTasks([
          {
            id: 1001,
            site_name: 'Site A',
            site_id: 'SITE-A-001',
            driver_name: demoProfile.name,
            driver_phone: demoProfile.phone,
            scheduled_at: new Date().toISOString(),
            status: 'pending',
            required_liters: 500,
            notes: 'Check tank level before refuel',
            site_latitude: 25.2048,
            site_longitude: 55.2708,
          },
          {
            id: 1002,
            site_name: 'Site B',
            site_id: 'SITE-B-002',
            driver_name: demoProfile.name,
            driver_phone: demoProfile.phone,
            scheduled_at: new Date(Date.now() + 3600000).toISOString(),
            status: 'in_progress',
            required_liters: 300,
            notes: 'Photograph counter',
            site_latitude: 25.1972,
            site_longitude: 55.2744,
          },
        ]);
        if (params.get('open') === '1') {
          setActiveTask({ id: 1001 });
          setEditOpen(true);
        }
        return;
      }
      const raw = localStorage.getItem('driver.profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const loadTasks = async () => {
    if (!profile || demoMode) return;
    const ors: string[] = [`driver_name.eq.${profile.name}`];
    if (profile.phone && profile.phone.trim())
      ors.push(`driver_phone.eq.${profile.phone}`);
    const { data } = await supabase
      .from('driver_tasks')
      .select('*')
      .or(ors.join(','))
      .order('scheduled_at', { ascending: true });
    setTasks(data || []);
  };

  useEffect(() => {
    loadTasks();
    if (profile && !demoMode) {
      loadNotifications();
    }
    const hasRealtime = typeof (supabase as any).channel === 'function';
    let channel: any = null;
    if (profile && hasRealtime && !demoMode) {
      try {
        channel = (supabase as any)
          .channel('driver-app-tasks')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'driver_tasks' },
            (payload: any) => {
              const row = (payload.new as any) || (payload.old as any) || {};
              if (
                row &&
                ((row.driver_name && row.driver_name === profile.name) ||
                  (row.driver_phone && row.driver_phone === profile.phone))
              ) {
                loadTasks();
              }
            },
          )
          .subscribe();
      } catch {}
    }
    return () => {
      try {
        if (channel && typeof (supabase as any).removeChannel === 'function') {
          (supabase as any).removeChannel(channel);
        }
      } catch {}
    };
  }, [profile, demoMode]);

  const activeCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== 'completed' &&
          t.admin_status !== 'Task returned to the driver',
      ).length,
    [tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  );
  const returnedCount = useMemo(
    () =>
      tasks.filter((t) => t.admin_status === 'Task returned to the driver')
        .length,
    [tasks],
  );

  const loadNotifications = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('driver_notifications')
      .select('id, created_at, title, message, driver_name, sent_by')
      .or(`driver_name.is.null,driver_name.eq.${profile.name}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    const ids = (data || []).map((n: any) => n.id);
    if (ids.length === 0) {
      setUnreadCount(0);
      return;
    }
    const { data: reads } = await supabase
      .from('driver_notification_reads')
      .select('notification_id')
      .eq('driver_name', profile.name)
      .in('notification_id', ids);
    const readSet = new Set((reads || []).map((r: any) => r.notification_id));
    const unread = ids.filter((id: number) => !readSet.has(id)).length;
    setUnreadCount(unread);
  };

  const filtered = useMemo(() => {
    let base = tasks;
    if (filterMode === 'completed') {
      base = base.filter((t) => t.status === 'completed');
    } else {
      base = base.filter((t) => t.status !== 'completed');
      if (filterMode === 'active')
        base = base.filter(
          (t) => t.status === 'in_progress' || t.status === 'pending',
        );
      if (filterMode === 'returned')
        base = base.filter(
          (t) => t.admin_status === 'Task returned to the driver',
        );
    }
    if (!query) return base;
    const q = query.toLowerCase();
    return base.filter((t) =>
      [t.site_name, t.status, t.notes].some((v: any) =>
        String(v || '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [tasks, query, filterMode]);

  const sha256 = async (text: string) => {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const verifyPassword = async () => {
    setErrorMsg('');
    const n = name.trim();
    const pw = password;
    if (!n || !pw) {
      setErrorMsg('Enter username and password');
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .ilike('name', n)
        .order('id', { ascending: false })
        .limit(1);
      if (error) {
        setErrorMsg('Login unavailable');
        return;
      }
      const row: any = data && data[0];
      if (!row || row.active === false) {
        setErrorMsg('Account not found or inactive');
        return;
      }
      if (!row.password_sha256) {
        setErrorMsg('Password not set');
        return;
      }
      const hash = await sha256(pw);
      if (hash !== row.password_sha256) {
        setErrorMsg('Invalid password');
        return;
      }
      const prof = { name: row.name || n, phone: (row.phone as string) || '' };
      setProfile(prof);
      try {
        localStorage.setItem('driver.profile', JSON.stringify(prof));
      } catch {}
    } finally {
      setVerifying(false);
    }
  };

  const logout = () => {
    setProfile(null);
    setScreen('home');
    try {
      localStorage.removeItem('driver.profile');
    } catch {}
  };

  const startTask = async (t: any) => {
    const { error } = await supabase
      .from('driver_tasks')
      .update({ status: 'in_progress' })
      .eq('id', t.id);
    if (!error)
      setTasks((arr) =>
        arr.map((x) => (x.id === t.id ? { ...x, status: 'in_progress' } : x)),
      );
  };

  const openDirections = (t: any) => {
    const lat = t.site_latitude || 25.2048;
    const lng = t.site_longitude || 55.2708;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openComplete = (t: any) => {
    setActiveTask(t);
    setEntry({
      site_id: String(t.site_name || ''),
      mission_id: String(t.id || ''),
      actual_liters_in_tank: '',
      quantity_added: '',
      notes: t.notes || '',
      counter_before_url: '',
      tank_before_url: '',
      counter_after_url: '',
      tank_after_url: '',
      tank_type: '',
      completed_at: '',
      vertical_calculated_liters: '',
      liters: '',
      rate: '',
      station: '',
      receipt: '',
      photo_url: '',
      odometer: '',
    });
    setPreviews({});
    setEditOpen(true);
  };

  const saveCompletion = async () => {
    if (!activeTask) return;
    const qty = parseFloat(entry.quantity_added || entry.liters || '0');
    const rate = entry.rate ? parseFloat(entry.rate) : null;
    const odometer = entry.odometer ? parseInt(entry.odometer) : null;
    await supabase.from('driver_task_entries').insert({
      task_id: activeTask.id,
      liters: qty,
      rate,
      station: entry.station || null,
      receipt_number: entry.receipt || null,
      photo_url: entry.photo_url || null,
      odometer: odometer as any,
      submitted_by: profile?.name || null,
    });
    await supabase
      .from('driver_tasks')
      .update({ status: 'completed', notes: entry.notes || null })
      .eq('id', activeTask.id);
    setTasks((arr) =>
      arr.map((x) =>
        x.id === activeTask.id ? { ...x, status: 'completed' } : x,
      ),
    );
    setEditOpen(false);
    setActiveTask(null);
  };

  if (!profile) {
    return (
      <LoginScreen
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        verifying={verifying}
        errorMsg={errorMsg}
        onLogin={verifyPassword}
      />
    );
  }

  if (screen === 'home') {
    return (
      <>
        <HomeScreen
          profile={profile}
          tasks={tasks}
          activeCount={activeCount}
          completedCount={completedCount}
          unreadCount={unreadCount}
          onOpenTasks={() => setScreen('tasks')}
          onOpenNotifications={() => setNotifOpen(true)}
          onLogout={logout}
          onRefresh={loadTasks}
        />
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#202B6D]">
                Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Card key={n.id} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (screen === 'tasks') {
    return (
      <>
        <TasksScreen
          filtered={filtered}
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          query={query}
          onQueryChange={setQuery}
          onTaskClick={(t) => {
            setActiveTask(t);
            setScreen('detail');
          }}
          onBack={() => setScreen('home')}
          onStartTask={startTask}
          onCompleteTask={openComplete}
        />
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#202B6D]">
                Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Card key={n.id} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (screen === 'detail' && activeTask) {
    return (
      <>
        <TaskDetailScreen
          task={activeTask}
          onBack={() => setScreen('tasks')}
          onOpenDirections={() => openDirections(activeTask)}
          onStartTask={() => {
            startTask(activeTask);
          }}
          onComplete={() => openComplete(activeTask)}
        />
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#202B6D]">
                Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Card key={n.id} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

// TODO: Remove old renderDialogs code - dialogs now rendered inline in screen states
function _RenderDialogsDisabled() {
  // Dialogs are now rendered inline in each screen state
  function renderDialogs() {
    return (
      <>
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#202B6D]">
                Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Card key={n.id} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#202B6D]">
                Submit Mission: {activeTask?.site_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">
                  Fuel Added (Liters) *
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={entry.quantity_added}
                  onChange={(e) =>
                    setEntry({ ...entry, quantity_added: e.target.value })
                  }
                  placeholder="0.00"
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#202B6D]"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">
                  Notes & Comments
                </Label>
                <Textarea
                  value={entry.notes}
                  onChange={(e) =>
                    setEntry({ ...entry, notes: e.target.value })
                  }
                  placeholder="Add any notes or observations..."
                  className="min-h-20 rounded-xl border-2 border-gray-200 focus:border-[#202B6D]"
                />
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-gray-700">
                  Evidence Photos
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      key: 'counter_before',
                      label: 'Counter Before',
                    },
                    { key: 'tank_before', label: 'Tank Before' },
                    { key: 'counter_after', label: 'Counter After' },
                    { key: 'tank_after', label: 'Tank After' },
                  ].map((item: any) => (
                    <div
                      key={item.key}
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center space-y-2"
                    >
                      {previews[item.key] || entry[`${item.key}_url`] ? (
                        <img
                          src={previews[item.key] || entry[`${item.key}_url`]}
                          alt={item.label}
                          className="w-full h-28 object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
                      )}
                      <p className="text-xs font-semibold text-gray-600">
                        {item.label}
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setPreviews((p) => ({
                              ...p,
                              [item.key]: url,
                            }));
                            await handleFile(
                              item.key as keyof typeof keyMap,
                              f,
                            );
                          }}
                          disabled={uploading[item.key]}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 rounded-lg text-sm"
                          disabled={uploading[item.key]}
                        >
                          {uploading[item.key] ? 'Uploading...' : 'Add Photo'}
                        </Button>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCompletion}
                className="bg-[#202B6D] hover:bg-[#1A2358] text-white rounded-xl h-11 font-bold"
              >
                Submit Completion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return renderDialogs();
}

function LoginScreen({
  name,
  setName,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  verifying,
  errorMsg,
  onLogin,
}: any) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#202B6D] to-[#0f1835] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F024d1e9b8e7144cd8fd4c3edfc34981b?format=webp&width=800"
              alt="ACES Managed Services"
              className="h-32 w-auto"
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="text-4xl font-bold text-white">ACES MSD Fuel</p>
          <p className="text-blue-100 text-lg">Driver Application</p>
        </div>

        <Card className="rounded-3xl border-0 shadow-2xl bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">
                Username
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username"
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#202B6D] focus:ring-2 focus:ring-[#202B6D]/20 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 rounded-xl border-2 border-gray-200 pr-12 focus:border-[#202B6D] focus:ring-2 focus:ring-[#202B6D]/20 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#202B6D] transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
              </div>
            )}

            <Button
              onClick={onLogin}
              disabled={verifying}
              className="w-full h-12 bg-[#202B6D] hover:bg-[#1A2358] text-white font-bold rounded-xl text-base transition"
            >
              {verifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-blue-100">
          Powered by <span className="font-bold">ACES MSD</span>
        </p>
      </div>
    </div>
  );
}

function HomeScreen({
  profile,
  tasks,
  activeCount,
  completedCount,
  unreadCount,
  onOpenTasks,
  onOpenNotifications,
  onLogout,
  onRefresh,
}: any) {
  const nextTask = useMemo(
    () =>
      tasks.find((t) => t.status === 'in_progress' || t.status === 'pending'),
    [tasks],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#202B6D]">ACES Driver</h1>
            <p className="text-xs text-gray-500">{profile.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 hover:bg-gray-100 rounded-full transition"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={onLogout}
              className="p-2.5 hover:bg-gray-100 rounded-full transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
        {nextTask && (
          <Card className="rounded-3xl border-0 shadow-md bg-gradient-to-br from-[#202B6D] to-[#1a2358] text-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-100 mb-1">
                    📍 Next Mission
                  </p>
                  <h2 className="text-2xl font-bold leading-tight">
                    {nextTask.site_name}
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    nextTask.status === 'in_progress'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {nextTask.status === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-blue-100">Required Liters</p>
                  <p className="text-lg font-bold">
                    {nextTask.required_liters || '-'} L
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-blue-100">Scheduled</p>
                  <p className="text-lg font-bold">
                    {new Date(nextTask.scheduled_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={onOpenTasks}
                  className="flex-1 bg-white text-[#202B6D] hover:bg-gray-100 font-bold rounded-xl h-11 transition"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 text-center space-y-3">
              <div className="bg-[#202B6D] w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#202B6D]">
                  {activeCount}
                </p>
                <p className="text-xs font-semibold text-gray-600">
                  Active Missions
                </p>
              </div>
              <Button
                onClick={onOpenTasks}
                variant="ghost"
                className="w-full text-[#202B6D] hover:bg-blue-200/50 rounded-lg h-10 font-semibold"
              >
                View All
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 text-center space-y-3">
              <div className="bg-green-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {completedCount}
                </p>
                <p className="text-xs font-semibold text-gray-600">Completed</p>
              </div>
              <Button
                onClick={onRefresh}
                variant="ghost"
                className="w-full text-green-700 hover:bg-green-200/50 rounded-lg h-10 font-semibold text-sm"
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-16">
            <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">
              No missions assigned
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Check back later or contact dispatch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TasksScreen({
  filtered,
  filterMode,
  onFilterChange,
  query,
  onQueryChange,
  onTaskClick,
  onBack,
  onStartTask,
  onCompleteTask,
}: any) {
  const filters = [
    { key: 'active', label: 'Active', icon: '⚡' },
    { key: 'returned', label: 'Returned', icon: '↩️' },
    { key: 'completed', label: 'Completed', icon: '✓' },
    { key: 'all', label: 'All', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-[#202B6D]">Missions</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search missions..."
              className="pl-10 h-11 rounded-xl border-2 border-gray-200 focus:border-[#202B6D] focus:ring-2 focus:ring-[#202B6D]/20"
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => onFilterChange(filter.key)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition ${
                  filterMode === filter.key
                    ? 'bg-[#202B6D] text-white shadow-md'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#202B6D]'
                }`}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">
              No missions found
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filtered.map((task) => (
            <Card
              key={task.id}
              className="rounded-2xl border-0 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      {new Date(task.scheduled_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {task.site_name}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      task.admin_status === 'Task returned to the driver'
                        ? 'bg-orange-100 text-orange-700'
                        : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : task.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.admin_status === 'Task returned to the driver'
                      ? 'Returned'
                      : task.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Required Liters</p>
                    <p className="font-bold text-gray-900">
                      {task.required_liters || '-'}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <p className="text-gray-500 text-xs">Driver</p>
                    <p className="font-bold text-gray-900">
                      {task.driver_name || '-'}
                    </p>
                  </div>
                </div>

                {task.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border-l-2 border-[#202B6D]">
                    {task.notes}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  {task.status === 'pending' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTask(task);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 font-semibold text-sm"
                    >
                      Start
                    </Button>
                  )}
                  {task.status !== 'completed' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task);
                      }}
                      className="flex-1 bg-[#202B6D] hover:bg-[#1A2358] text-white rounded-lg h-10 font-semibold text-sm"
                    >
                      Complete
                    </Button>
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

function TaskDetailScreen({
  task,
  onBack,
  onOpenDirections,
  onStartTask,
  onComplete,
}: any) {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    returned:
      task.admin_status === 'Task returned to the driver'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-gray-100 text-gray-700',
  };

  const status = task.admin_status || task.status;
  const statusColor = statusColors[status] || statusColors.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-[#202B6D]">Mission Details</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
        <Card className="rounded-3xl border-0 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {task.site_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Task ID: {task.id || task.site_id}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusColor}`}
                >
                  {task.admin_status === 'Task returned to the driver'
                    ? 'Returned'
                    : task.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
              <div>
                <p className="text-sm text-gray-500 font-semibold">
                  Required Liters
                </p>
                <p className="text-2xl font-bold text-[#202B6D] mt-1">
                  {task.required_liters || '-'} L
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">Scheduled</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {new Date(task.scheduled_at).toLocaleString()}
                </p>
              </div>
            </div>

            {task.notes && (
              <div className="bg-blue-50 border-l-4 border-[#202B6D] rounded-lg p-4 space-y-2">
                <p className="text-sm font-bold text-gray-900">📝 Notes</p>
                <p className="text-gray-700 text-sm">{task.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {task.status === 'pending' && (
            <Button
              onClick={onStartTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 transition"
            >
              Start Mission
            </Button>
          )}

          <Button
            onClick={onOpenDirections}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-12 flex items-center justify-center gap-2 transition"
          >
            <Navigation className="w-5 h-5" />
            Open Directions
          </Button>

          {task.status !== 'completed' && (
            <Button
              onClick={onComplete}
              className="w-full bg-[#202B6D] hover:bg-[#1A2358] text-white font-bold rounded-xl h-12 transition"
            >
              Complete Mission
            </Button>
          )}
        </div>

        {task.status === 'completed' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
            <p className="text-xl font-bold text-green-700">Mission Complete</p>
            <p className="text-sm text-green-600">
              Thank you for completing this mission!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
