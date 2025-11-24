import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

// Mission type
type Mission = {
  id: number;
  missionId: string;
  siteName: string;
  generator: string;
  project: string;
  driverName: string;
  createdDate: string; // ISO
  filledLiters: number; // Added Liters (renamed from Filled liters)
  virtualCalculated: number;
  actualInTank: number;
  quantityAddedLastTask: number;
  city: string;
  notes?: string;
  // accept any string from backend; specific values are still used elsewhere
  missionStatus: string;
  assignedDriver: string;
  createdBy: string;
};

const STATUS_ORDER: Mission['missionStatus'][] = [
  'Creation',
  'Finished by Driver',
  'Task approved',
  'Task returned to the driver',
  'Reported by driver',
  'Canceled',
];

const statusColor: Record<Mission['missionStatus'], string> = {
  Creation: 'bg-orange-500',
  'Finished by Driver': 'bg-sky-500',
  'Task approved': 'bg-emerald-500',
  'Task returned to the driver': 'bg-indigo-500',
  'Reported by driver': 'bg-rose-500',
  Canceled: 'bg-gray-400',
};

// Visible columns and labels in order requested
const VISIBLE_COLUMNS = [
  { key: 'missionId', label: 'Mission ID' },
  { key: 'siteName', label: 'Site Name' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'filledLiters', label: 'Added Liters' },
  { key: 'actualInTank', label: 'Actual Liters Found in Tank' },
  {
    key: 'quantityAddedLastTask',
    label: 'Quantity Added (Last Task)',
  },
  { key: 'city', label: 'City' },
  { key: 'missionStatus', label: 'Mission Status' },
] as const;

type ColumnKey = (typeof VISIBLE_COLUMNS)[number]['key'];

type AddTaskForm = {
  siteName: string;
  driverId?: number | null;
  driverName: string;
  driverPhone: string;
  scheduledAt: string;
  requiredLiters?: number | null;
  notes?: string;
};

export default function MissionsPage() {
  const [rows, setRows] = useState<Mission[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<
    'All' | Mission['missionStatus']
  >('All');

  // Column-specific filters
  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>(
    {},
  );

  const [addOpen, setAddOpen] = useState(false);
  const emptyForm: AddTaskForm = {
    siteName: '',
    driverId: null,
    driverName: '',
    driverPhone: '',
    scheduledAt: '',
    requiredLiters: null,
    notes: '',
  };
  const [addForm, setAddForm] = useState<AddTaskForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<
    Partial<Record<keyof AddTaskForm, string>>
  >({});
  const [drivers, setDrivers] = useState<
    { id: number; name: string; phone: string | null }[]
  >([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [entryByTask, setEntryByTask] = useState<Record<number, any | null>>(
    {},
  );
  const [imagesByTask, setImagesByTask] = useState<Record<number, string[]>>(
    {},
  );
  const [imageOpen, setImageOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<
    Record<
      number,
      { notes: string; added: number; actual: number; qtyLast: number }
    >
  >({});
  const [editing, setEditing] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, name, phone, active')
        .order('name');
      if (!mounted) return;
      if (data)
        setDrivers(
          data.map((d: any) => ({
            id: Number(d.id),
            name: d.name || '',
            phone: d.phone || null,
          })),
        );
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function validate(form: AddTaskForm) {
    const errs: Partial<Record<keyof AddTaskForm, string>> = {};
    if (!form.siteName.trim()) errs.siteName = 'required';
    if (!form.driverName.trim()) errs.driverName = 'required';
    return errs;
  }

  const handleAdd = async () => {
    const errs = validate(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const scheduled_iso = addForm.scheduledAt
      ? new Date(addForm.scheduledAt).toISOString()
      : null;
    const payload = {
      site_id: null as number | null,
      site_name: addForm.siteName.trim(),
      driver_name: addForm.driverName.trim(),
      driver_phone: addForm.driverPhone || null,
      scheduled_at: scheduled_iso,
      status: 'pending',
      admin_status: 'Creation',
      required_liters: addForm.requiredLiters ?? null,
      notes: addForm.notes || null,
    };
    const { data, error } = await supabase
      .from('driver_tasks')
      .insert(payload)
      .select(
        'id, site_name, driver_name, scheduled_at, status, required_liters, notes, created_at',
      )
      .single();
    if (error || !data) {
      toast({
        title: 'Create failed',
        description: error?.message || 'Unknown error',
      });
      return;
    }
    const createdDate =
      (data.created_at as string)?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10);
    const newRow: Mission = {
      id: Number(data.id),
      missionId: String(data.id),
      siteName: (data.site_name as string) || '',
      generator: '',
      project: '',
      driverName: (data.driver_name as string) || '',
      createdDate,
      filledLiters: 0,
      virtualCalculated: 0,
      actualInTank: 0,
      quantityAddedLastTask: Number(data.required_liters || 0),
      city: '',
      notes: (data.notes as string) || '',
      missionStatus: 'Creation',
      assignedDriver: (data.driver_name as string) || '',
      createdBy:
        localStorage.getItem('auth.username') ||
        localStorage.getItem('remember.username') ||
        'User',
    };
    setRows((r) => [newRow, ...r]);
    toast({ title: 'Task created' });
    try {
      const sentBy =
        localStorage.getItem('auth.username') ||
        localStorage.getItem('remember.username') ||
        'Admin';
      await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'driver_notifications',
          operation: 'insert',
          data: {
            title: 'New mission assigned',
            message: `A new mission has been assigned to you for site: ${addForm.siteName}`,
            driver_name: addForm.driverName || null,
            sent_by: sentBy,
          },
        }),
      });
    } catch {}
    setAddForm(emptyForm);
    setAddOpen(false);
  };

  const toggleExpand = async (r: Mission) => {
    setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }));
    if (!expanded[r.id]) {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'driver_task_entries',
          operation: 'select',
          select:
            'liters, rate, station, receipt_number, photo_url, odometer, submitted_by, submitted_at',
          filters: { task_id: r.id },
          order: ['submitted_at', 'desc'],
        }),
      });
      const { data } = await response.json();
      setEntryByTask((m) => ({ ...m, [r.id]: data?.[0] || null }));
      try {
        const dir = `${(r.driverName || 'driver').replace(/\s+/g, '_')}/${r.id}`;
        const { data: files } = await (supabase.storage as any)
          .from('driver-uploads')
          .list(dir, { limit: 20 });
        if (files && Array.isArray(files)) {
          const urls = files.map(
            (f: any) =>
              (supabase.storage as any)
                .from('driver-uploads')
                .getPublicUrl(`${dir}/${f.name}`).data.publicUrl,
          );
          setImagesByTask((m) => ({ ...m, [r.id]: urls }));
        }
      } catch {}
      setEditDraft((d) => ({
        ...d,
        [r.id]: {
          notes: r.notes || '',
          added: r.filledLiters || 0,
          actual: r.actualInTank || 0,
          qtyLast: r.quantityAddedLastTask || 0,
        },
      }));
    }
  };

  const setAdminStatus = async (
    id: number,
    status: Mission['missionStatus'],
  ) => {
    const newAdmin = status === 'Task approved' ? 'approved' : status;
    const { error } = await supabase
      .from('driver_tasks')
      .update({ admin_status: newAdmin })
      .eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message });
      return;
    }
    if (status === 'Task approved') {
      const t = rows.find((r) => r.id === id);
      if (t) {
        await fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'approved_reports',
            operation: 'insert',
            data: {
              task_id: id,
              mission_id: t.missionId,
              site_name: t.siteName,
              driver_name: t.driverName,
              quantity_added: t.quantityAddedLastTask || t.filledLiters || null,
              notes: t.notes || null,
              status: 'approved',
            },
          }),
        });
      }
      setRows((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, missionStatus: 'Task approved' } : r,
        ),
      );
      toast({ title: 'Mission approved and locked for editing' });
      return;
    }
    setRows((arr) =>
      arr.map((r) => (r.id === id ? { ...r, missionStatus: status } : r)),
    );
    toast({ title: `Status: ${status}` });
  };

  const saveEdit = async (r: Mission) => {
    const draft = editDraft[r.id];
    if (!draft) return;
    // Update local
    setRows((arr) =>
      arr.map((x) =>
        x.id === r.id
          ? {
              ...x,
              notes: draft.notes,
              filledLiters: Number(draft.added) || 0,
              actualInTank: Number(draft.actual) || 0,
              quantityAddedLastTask: Number(draft.qtyLast) || 0,
            }
          : x,
      ),
    );
    // Persist
    try {
      await supabase
        .from('driver_tasks')
        .update({
          notes: draft.notes || null,
          required_liters: Number(draft.qtyLast) || 0,
        })
        .eq('id', r.id);
    } catch {}
    toast({ title: 'Saved' });
    setEditing((e) => ({ ...e, [r.id]: false }));
  };

  const handleSyncAll = async () => {
    if (rows.length === 0) {
      toast({ title: 'No missions to sync' });
      return;
    }
    const payload = rows.map((r) => ({
      site_id: null as number | null,
      site_name: r.siteName,
      driver_name: r.assignedDriver || r.driverName,
      driver_phone: null as string | null,
      scheduled_at: null as string | null,
      status: 'pending',
      admin_status: r.missionStatus,
      required_liters: r.quantityAddedLastTask || r.filledLiters || null,
      notes: r.notes || null,
    }));
    const response = await fetch('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'driver_tasks',
        operation: 'insert',
        data: payload,
      }),
    });
    const { error } = await response.json();
    if (error) {
      toast({ title: 'Sync failed', description: error });
      return;
    }
    try {
      const sentBy =
        localStorage.getItem('auth.username') ||
        localStorage.getItem('remember.username') ||
        'Admin';
      const notices = rows.map((r) => ({
        title: 'New mission assigned',
        message: `A new mission has been assigned to you for site: ${r.siteName}`,
        driver_name: r.assignedDriver || r.driverName || null,
        sent_by: sentBy,
      }));
      if (notices.length > 0)
        await fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'driver_notifications',
            operation: 'insert',
            data: notices,
          }),
        });
    } catch {}
    toast({ title: 'Missions synced to Supabase' });
  };

  const loadFromDb = async () => {
    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'driver_tasks',
          operation: 'select',
          select:
            'id, mission_id, site_name, driver_name, scheduled_at, status, admin_status, required_liters, notes, created_at',
          order: ['created_at', 'desc'],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch missions');
      }

      const { data, error } = await response.json();
      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          title: 'No missions found',
          description: 'Try adding a mission or refreshing.',
        });
        setRows([]);
        return;
      }
      const mapStatus = (s?: string): Mission['missionStatus'] => {
        switch ((s || '').toLowerCase()) {
          case 'completed':
            return 'Finished by Driver';
          case 'in_progress':
            return 'Reported by driver';
          case 'canceled':
            return 'Canceled';
          default:
            return 'Creation';
        }
      };
      const mapped: Mission[] = data.map((d: any) => ({
        id: Number(d.id),
        missionId: String(d.mission_id || ''),
        siteName: d.site_name || '',
        generator: '',
        project: '',
        driverName: d.driver_name || '',
        createdDate:
          (d.scheduled_at as string)?.slice(0, 10) ||
          (d.created_at as string)?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
        filledLiters: 0,
        virtualCalculated: 0,
        actualInTank: 0,
        quantityAddedLastTask: Number(d.required_liters || 0),
        city: '',
        notes: d.notes || '',
        missionStatus: (d.admin_status as string) || mapStatus(d.status),
        assignedDriver: d.driver_name || '',
        createdBy: 'System',
      }));
      setRows(mapped);
      return;
    } catch (clientErr) {
      console.error('Supabase client error', clientErr);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as
          | string
          | undefined;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
          | string
          | undefined;
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase env vars missing; skipping REST fallback');
          toast({
            title: 'Supabase not configured',
            description:
              'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to enable REST fallback.',
          });
          setRows([]);
          return;
        }
        if (!/^https?:\/\//i.test(supabaseUrl)) {
          console.error('Invalid VITE_SUPABASE_URL:', supabaseUrl);
          toast({
            title: 'Invalid Supabase URL',
            description:
              'VITE_SUPABASE_URL must start with http:// or https://',
          });
          return;
        }
        const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/driver_tasks?select=id,mission_id,site_name,driver_name,status,admin_status,required_liters,notes,created_at`;
        const res = await fetch(url, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('REST fetch failed', res.status, text);
          if (text && text.trim().startsWith('<!doctype')) {
            toast({
              title: 'Supabase REST returned HTML',
              description:
                'The REST URL returned HTML (likely your app index). Check VITE_SUPABASE_URL value and that the Supabase project is reachable.',
            });
          } else {
            toast({
              title: 'Failed to load missions',
              description: `REST ${res.status}: ${text}`,
            });
          }
          return;
        }
        let json: any;
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) json = await res.json();
          else {
            const text = await res.text();
            console.error('REST returned non-JSON', text);
            toast({
              title: 'Failed to load missions',
              description:
                'Supabase returned an unexpected response (non-JSON). Verify your Supabase REST endpoint and project URL.',
            });
            return;
          }
        } catch (parseErr) {
          console.error('Failed parsing REST response', parseErr);
          toast({
            title: 'Failed to load missions',
            description: 'Invalid JSON from Supabase REST endpoint.',
          });
          return;
        }
        if (!Array.isArray(json) || json.length === 0) {
          toast({
            title: 'No missions found',
            description: 'Try adding a mission or refreshing.',
          });
          setRows([]);
          return;
        }
        const mapped = json.map((d: any) => ({
          id: Number(d.id),
          missionId: String(d.mission_id || ''),
          siteName: d.site_name || '',
          generator: '',
          project: '',
          driverName: d.driver_name || '',
          createdDate: (d.created_at || new Date().toISOString()).slice(0, 10),
          filledLiters: 0,
          virtualCalculated: 0,
          actualInTank: 0,
          quantityAddedLastTask: Number(d.required_liters || 0),
          city: '',
          notes: d.notes || '',
          missionStatus: (d.admin_status as string) || 'Creation',
          assignedDriver: d.driver_name || '',
          createdBy: 'System',
        }));
        setRows(mapped);
        return;
      } catch (restErr) {
        console.error('REST fetch exception', restErr);
        const origin =
          typeof window !== 'undefined'
            ? window.location.origin
            : 'your app origin';
        toast({
          title: 'Failed to load missions',
          description:
            'Network error (Failed to fetch). This commonly happens due to CORS or network restrictions. Add the app origin to Supabase Allowed Origins or ensure the project URL is reachable.',
        });
        console.info(
          `Action: add ${origin} to Supabase → Settings → API → Allowed origins (CORS)`,
        );
        return;
      }
    }
  };

  useEffect(() => {
    loadFromDb();
    const hasRealtime = typeof (supabase as any).channel === 'function';
    let channel: any = null;
    if (hasRealtime) {
      try {
        channel = (supabase as any)
          .channel('missions-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'driver_tasks' },
            () => loadFromDb(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'driver_task_entries' },
            () => loadFromDb(),
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription failed', e);
      }
    } else {
      console.info(
        'Realtime not available on Supabase client; skipping subscription',
      );
    }
    return () => {
      try {
        if (channel && typeof (supabase as any).removeChannel === 'function') {
          (supabase as any).removeChannel(channel);
        }
      } catch (e) {}
    };
  }, []);

  const counts = useMemo(() => {
    const map: Record<Mission['missionStatus'], number> = {
      Creation: 0,
      'Finished by Driver': 0,
      'Task approved': 0,
      'Task returned to the driver': 0,
      'Reported by driver': 0,
      Canceled: 0,
    };
    rows.forEach((r) => map[r.missionStatus]++);
    return map;
  }, [rows]);

  const filteredByStatus = useMemo(() => {
    const base = rows.filter((r) => r.missionStatus !== 'Task approved');
    if (statusFilter === 'All') return base;
    return base.filter((r) => r.missionStatus === statusFilter);
  }, [rows, statusFilter]);

  const filtered = useMemo(() => {
    const f = filteredByStatus.filter((r) => {
      // Apply column filters
      return (
        (filters.missionId
          ? String(r.missionId)
              .toLowerCase()
              .includes(filters.missionId.toLowerCase())
          : true) &&
        (filters.siteName
          ? String(r.siteName)
              .toLowerCase()
              .includes(filters.siteName.toLowerCase())
          : true) &&
        (filters.createdDate
          ? String(r.createdDate).includes(filters.createdDate)
          : true) &&
        (filters.filledLiters
          ? String(r.filledLiters).includes(filters.filledLiters)
          : true) &&
        (filters.actualInTank
          ? String(r.actualInTank).includes(filters.actualInTank)
          : true) &&
        (filters.quantityAddedLastTask
          ? String(r.quantityAddedLastTask).includes(
              filters.quantityAddedLastTask,
            )
          : true) &&
        (filters.city
          ? String(r.city).toLowerCase().includes(filters.city.toLowerCase())
          : true) &&
        (filters.missionStatus
          ? String(r.missionStatus) === filters.missionStatus
          : true)
      );
    });
    return f;
  }, [filteredByStatus, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalMissions = rows.length;
  const pendingMissions = rows.filter(
    (r) => r.missionStatus === 'Creation',
  ).length;
  const approvedMissions = rows.filter(
    (r) => r.missionStatus === 'Task approved',
  ).length;

  const exportXlsx = () => {
    const headers = VISIBLE_COLUMNS.map((c) => c.label);
    const data = filtered.map((r) => [
      r.missionId,
      r.siteName,
      r.createdDate,
      r.filledLiters,
      r.actualInTank,
      r.quantityAddedLastTask,
      r.city,
      r.missionStatus,
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Missions');
    XLSX.writeFile(wb, 'missions.xlsx');
  };

  const remove = async (id: number) => {
    await fetch('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'driver_tasks',
        operation: 'delete',
        filters: { id },
      }),
    });
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <PageLayout
      title="Mission operations"
      description="Coordinate planning, dispatch and approvals with a single operational console."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Missions' }]}
      actions={
        <Button
          variant="outline"
          className="rounded-full border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-sm shadow-black/20 transition hover:border-white/40 hover:bg-white/20"
          onClick={exportXlsx}
        >
          <Download className="mr-2 h-4 w-4" /> Export manifest
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Total missions',
              value: totalMissions.toLocaleString(),
              description: 'All records synced from the last refresh.',
            },
            {
              label: 'Pending dispatch',
              value: pendingMissions.toLocaleString(),
              description: 'Awaiting confirmation or driver acceptance.',
            },
            {
              label: 'Approved',
              value: approvedMissions.toLocaleString(),
              description: 'Ready for invoicing and reporting.',
            },
          ].map((metric) => (
            <Card
              key={metric.label}
              className="rounded-3xl border border-white/10 bg-white/[0.07] text-slate-100 shadow-lg backdrop-blur"
            >
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-black">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-black">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <div className="mb-6 flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400">
              <Plus className="mr-2 h-4 w-4" /> Add new mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="m-site">Site name</Label>
                <Input
                  id="m-site"
                  value={addForm.siteName}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, siteName: e.target.value }))
                  }
                />
                {addErrors.siteName && (
                  <span className="text-sm text-black">required</span>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Driver</Label>
                <Select
                  value={addForm.driverId ? String(addForm.driverId) : ''}
                  onValueChange={(v) => {
                    const d = drivers.find((x) => String(x.id) === v);
                    setAddForm((s) => ({
                      ...s,
                      driverId: d ? d.id : null,
                      driverName: d ? d.name : '',
                      driverPhone: d?.phone || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-phone">Driver phone</Label>
                <Input
                  id="m-phone"
                  value={addForm.driverPhone}
                  onChange={(e) =>
                    setAddForm((s) => ({
                      ...s,
                      driverPhone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-when">Scheduled at</Label>
                <Input
                  id="m-when"
                  type="datetime-local"
                  value={addForm.scheduledAt}
                  onChange={(e) =>
                    setAddForm((s) => ({
                      ...s,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-liters">Required liters</Label>
                <Input
                  id="m-liters"
                  type="number"
                  value={addForm.requiredLiters ?? ''}
                  onChange={(e) =>
                    setAddForm((s) => ({
                      ...s,
                      requiredLiters:
                        e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-notes">Notes</Label>
                <Textarea
                  id="m-notes"
                  value={addForm.notes}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="cursor-pointer"
          onClick={() => setStatusFilter('All')}
        >
          All{' '}
          <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-foreground">
            {rows.length}
          </span>
        </Badge>
        {STATUS_ORDER.map((s) => (
          <Badge
            key={s}
            className={`${statusColor[s]} cursor-pointer text-black hover:opacity-90`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
            <span className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs">
              {counts[s] || 0}
            </span>
          </Badge>
        ))}
      </div>

      <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-xl backdrop-blur">
        <CardContent className="p-0 text-black">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200/70">
              Missions
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs uppercase tracking-[0.2em] text-black">
                Rows per page
              </div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[110px] border-white/20 bg-white/10 text-white focus:ring-sky-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                  {[25, 50, 100, 250, 500].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-hidden">
            <Table className="table-fixed text-black">
              <TableHeader>
                <TableRow className="bg-white/[0.08] text-xs uppercase tracking-[0.2em] text-slate-100">
                  <TableHead className="border-none text-black">
                    Mission ID
                  </TableHead>
                  <TableHead className="border-none text-black">
                    Site Name
                  </TableHead>
                  <TableHead className="border-none text-black">
                    Created Date
                  </TableHead>
                  <TableHead className="border-none text-black">
                    Added Liters
                  </TableHead>
                  <TableHead className="border-none text-black">
                    Actual Liters Found in Tank
                  </TableHead>
                  <TableHead className="border-none text-black">
                    Quantity Added (Last Task)
                  </TableHead>
                  <TableHead className="border-none text-black">City</TableHead>
                  <TableHead className="border-none text-black">
                    Mission Status
                  </TableHead>
                </TableRow>
                {/* Filter row */}
                <TableRow className="bg-white/[0.04]">
                  <TableHead>
                    <Input
                      placeholder="Filter"
                      className="h-8"
                      value={filters.missionId || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          missionId: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter"
                      className="h-8"
                      value={filters.siteName || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          siteName: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      type="date"
                      className="h-8"
                      value={filters.createdDate || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          createdDate: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      type="number"
                      placeholder="="
                      className="h-8"
                      value={filters.filledLiters || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          filledLiters: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      type="number"
                      placeholder="="
                      className="h-8"
                      value={filters.actualInTank || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          actualInTank: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      type="number"
                      placeholder="="
                      className="h-8"
                      value={filters.quantityAddedLastTask || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          quantityAddedLastTask: e.target.value,
                        }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter"
                      className="h-8"
                      value={filters.city || ''}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, city: e.target.value }));
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <Select
                      value={filters.missionStatus || '__ALL__'}
                      onValueChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          missionStatus: v === '__ALL__' ? '' : v,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">All</SelectItem>
                        {STATUS_ORDER.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => toggleExpand(r)}
                    className="cursor-pointer border-b border-white/5 bg-white/[0.02] text-sm text-black transition hover:bg-white/[0.08]"
                  >
                    <TableCell className="font-medium break-words text-black">
                      {r.missionId}
                    </TableCell>
                    <TableCell className="font-medium break-words text-black">
                      {r.siteName}
                    </TableCell>
                    <TableCell className="break-words text-black">
                      {r.createdDate}
                    </TableCell>
                    <TableCell className="break-words text-black">
                      {r.filledLiters}
                    </TableCell>
                    <TableCell className="break-words text-black">
                      {r.actualInTank}
                    </TableCell>
                    <TableCell className="break-words text-black">
                      {r.quantityAddedLastTask}
                    </TableCell>
                    <TableCell className="break-words text-black">
                      {r.city}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-0.5 text-xs text-black ${statusColor[r.missionStatus]}`}
                      >
                        {r.missionStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {current.map((r) =>
                  expanded[r.id] ? (
                    <TableRow
                      key={`exp-${r.id}`}
                      className="bg-white/[0.02] border-b border-white/5"
                    >
                      <TableCell colSpan={VISIBLE_COLUMNS.length}>
                        <div className="grid grid-cols-1 gap-3 p-4 rounded-md transition-all duration-300 ease-in-out md:grid-cols-3 text-black">
                          <div>
                            <div className="text-xs text-black">Mission ID</div>
                            <div className="font-medium text-black">
                              {r.missionId}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-black">Site Name</div>
                            <div className="font-medium text-black">
                              {r.siteName}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-black">
                              Driver Name
                            </div>
                            <div className="font-medium text-black">
                              {r.driverName}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-black">
                              Required Liters
                            </div>
                            <div className="font-medium text-black">
                              {r.quantityAddedLastTask}
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <div className="text-xs text-black">
                              Driver Entry
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-black">
                              <div>
                                Liters: {entryByTask[r.id]?.liters ?? '-'}
                              </div>
                              <div>Rate: {entryByTask[r.id]?.rate ?? '-'}</div>
                              <div>
                                Station: {entryByTask[r.id]?.station ?? '-'}
                              </div>
                              <div>
                                Receipt #:{' '}
                                {entryByTask[r.id]?.receipt_number ?? '-'}
                              </div>
                              <div>
                                Odometer: {entryByTask[r.id]?.odometer ?? '-'}
                              </div>
                              <div>
                                Submitted By:{' '}
                                {entryByTask[r.id]?.submitted_by ?? '-'}
                              </div>
                              <div className="col-span-2">
                                Submitted At:{' '}
                                {entryByTask[r.id]?.submitted_at ?? '-'}
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <div className="text-xs text-black mb-1">
                              Images
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {entryByTask[r.id]?.photo_url && (
                                <img
                                  src={entryByTask[r.id]?.photo_url}
                                  alt="photo"
                                  className="h-24 w-24 rounded object-cover cursor-zoom-in"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageSrc(
                                      entryByTask[r.id]?.photo_url as string,
                                    );
                                    setImageOpen(true);
                                  }}
                                />
                              )}
                              {(imagesByTask[r.id] || []).map((u, i) => (
                                <img
                                  key={i}
                                  src={u}
                                  alt={`upload-${i + 1}`}
                                  className="h-24 w-24 rounded object-cover cursor-zoom-in"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageSrc(u);
                                    setImageOpen(true);
                                  }}
                                />
                              ))}
                              {!entryByTask[r.id]?.photo_url &&
                                (!imagesByTask[r.id] ||
                                  imagesByTask[r.id].length === 0) && (
                                  <div className="text-sm text-black">
                                    No images
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Inline edit form */}
                          <div className="md:col-span-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                              <div className="text-xs text-black">
                                Added Liters
                              </div>
                              <Input
                                type="number"
                                className="mt-1"
                                value={editDraft[r.id]?.added ?? 0}
                                disabled={r.missionStatus === 'Task approved'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    [r.id]: {
                                      ...(d[r.id] || {
                                        notes: '',
                                        added: 0,
                                        actual: 0,
                                        qtyLast: 0,
                                      }),
                                      added: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <div className="text-xs text-black">
                                Actual In Tank
                              </div>
                              <Input
                                type="number"
                                className="mt-1"
                                value={editDraft[r.id]?.actual ?? 0}
                                disabled={r.missionStatus === 'Task approved'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    [r.id]: {
                                      ...(d[r.id] || {
                                        notes: '',
                                        added: 0,
                                        actual: 0,
                                        qtyLast: 0,
                                      }),
                                      actual: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <div className="text-xs text-black">
                                Quantity Added (Last Task)
                              </div>
                              <Input
                                type="number"
                                className="mt-1"
                                value={editDraft[r.id]?.qtyLast ?? 0}
                                disabled={r.missionStatus === 'Task approved'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    [r.id]: {
                                      ...(d[r.id] || {
                                        notes: '',
                                        added: 0,
                                        actual: 0,
                                        qtyLast: 0,
                                      }),
                                      qtyLast: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="md:col-span-1">
                              <div className="text-xs text-black">Notes</div>
                              <Input
                                className="mt-1"
                                value={editDraft[r.id]?.notes ?? ''}
                                disabled={r.missionStatus === 'Task approved'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    [r.id]: {
                                      ...(d[r.id] || {
                                        notes: '',
                                        added: 0,
                                        actual: 0,
                                        qtyLast: 0,
                                      }),
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-2">
                            <Button
                              className="bg-[#16A34A] hover:opacity-90"
                              disabled={r.missionStatus === 'Task approved'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminStatus(r.id, 'Task approved');
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              disabled={r.missionStatus === 'Task approved'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminStatus(
                                  r.id,
                                  'Task returned to the driver',
                                );
                              }}
                            >
                              Return to Driver
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={r.missionStatus === 'Task approved'}
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(r.id);
                              }}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={r.missionStatus === 'Task approved'}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Edit opens inline fields above; make changes then click Save Changes
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              disabled={r.missionStatus === 'Task approved'}
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit(r);
                              }}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null,
                )}
                {current.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={VISIBLE_COLUMNS.length}
                      className="py-10 text-center text-sm text-black"
                    >
                      No results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-sm text-black">
            <div>
              Showing {current.length} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={imageOpen}
        onOpenChange={(o) => {
          setImageOpen(o);
          if (!o) setImageSrc(null);
        }}
      >
        <DialogContent className="sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <div className="max-h-[80vh] w-full">
              <img
                src={imageSrc}
                alt="preview"
                className="mx-auto max-h-[75vh] w-auto rounded object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
