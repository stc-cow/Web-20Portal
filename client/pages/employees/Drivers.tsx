import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
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

async function sha256(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
import { Download, Plus, Eye, Pencil, CheckCircle2, XCircle } from 'lucide-react';

type Driver = {
  id: number;
  name: string;
  phone: string;
  zone: string;
  active: boolean;
};

const initialRows: Driver[] = [
  {
    id: 1,
    name: 'Gul Muhammad',
    phone: '500861573',
    zone: 'Mobily East Region',
    active: true,
  },
  {
    id: 2,
    name: 'Irfan',
    phone: '566041714',
    zone: 'COW East Region',
    active: true,
  },
  {
    id: 3,
    name: 'Pradeep Singh',
    phone: '',
    zone: 'Mobily East Region',
    active: false,
  },
  { id: 4, name: 'MURALI.MUSAFMY', phone: '570235067', zone: '', active: true },
  {
    id: 5,
    name: 'ZAFAR ABDUL SATTAR',
    phone: '500832560',
    zone: 'COW East Region',
    active: true,
  },
  { id: 6, name: 'Reaza', phone: '547621843', zone: '', active: true },
  {
    id: 7,
    name: 'AWAHE',
    phone: '530408743',
    zone: 'COW East Region',
    active: false,
  },
  { id: 8, name: 'Tayyab', phone: '507687421', zone: '', active: true },
  {
    id: 9,
    name: 'Anwar',
    phone: '591445707',
    zone: 'COW Central Region',
    active: true,
  },
  {
    id: 10,
    name: 'Kamran A Noor Akbar Khan',
    phone: '582115996',
    zone: 'COW Central Region',
    active: true,
  },
];

const allColumns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'zone', label: 'Zone' },
  { key: 'active', label: 'Active' },
  { key: 'settings', label: 'Settings' },
] as const;

type ColumnKey = (typeof allColumns)[number]['key'];

export default function DriversPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Driver[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cols, setCols] = useState<Record<ColumnKey, boolean>>({
    name: true,
    phone: true,
    zone: true,
    active: true,
    settings: true,
  });
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  type DriverForm = {
    name: string;
    phone: string;
    zone: string;
    active: boolean;
  };
  const emptyForm: DriverForm = { name: '', phone: '', zone: '', active: true };
  const [addOpen, setAddOpen] = useState(false);
  const [addPassword, setAddPassword] = useState('');
  const [addForm, setAddForm] = useState<DriverForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<
    Partial<Record<keyof DriverForm, string>>
  >({});

  function validate(form: DriverForm) {
    const errs: Partial<Record<keyof DriverForm, string>> = {};
    if (!form.name.trim()) errs.name = 'required';
    return errs;
  }

  const handleAdd = async () => {
    const errs = validate(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const insertBody: any = {
      name: addForm.name,
      phone: addForm.phone || null,
      zone: addForm.zone || null,
      active: addForm.active,
    };
    if (addPassword) insertBody.password_sha256 = await sha256(addPassword);
    let data, error;
    ({ data, error } = await supabase
      .from('drivers')
      .insert(insertBody)
      .select('id, name, phone, zone, active')
      .single());
    if (error && addPassword && /password_sha256/.test(error.message)) {
      ({ data, error } = await supabase
        .from('drivers')
        .insert({
          name: insertBody.name,
          phone: insertBody.phone,
          zone: insertBody.zone,
          active: insertBody.active,
        })
        .select('id, name, phone, zone, active')
        .single());
      if (!error) {
        toast({
          title: 'Saved without password',
          description:
            "Create a 'password_sha256' column in Supabase to enable password login.",
        });
      }
    }
    if (error || !data) {
      toast({
        title: 'Create failed',
        description: error?.message || 'Unknown error',
      });
      return;
    }
    setRows((r) => [
      {
        id: Number(data.id),
        name: (data.name as string) || '',
        phone: (data.phone as string) || '',
        zone: (data.zone as string) || '',
        active: Boolean(data.active),
      },
      ...r,
    ]);
    toast({ title: 'Driver created' });
    setAddForm(emptyForm);
    setAddPassword('');
    setAddOpen(false);
  };

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Driver | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Driver | null>(null);
  const [editPassword, setEditPassword] = useState('');

  const openView = (row: Driver) => {
    setViewing(row);
    setViewOpen(true);
  };
  const openEdit = (row: Driver) => {
    setEditForm({ ...row });
    setEditPassword('');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    const errs = validate({
      name: editForm.name,
      phone: editForm.phone,
      zone: editForm.zone,
      active: editForm.active,
    });
    if (Object.keys(errs).length > 0) return;
    const updateBody: any = {
      name: editForm.name,
      phone: editForm.phone || null,
      zone: editForm.zone || null,
      active: editForm.active,
    };
    if (editPassword) updateBody.password_sha256 = await sha256(editPassword);
    let error;
    ({ error } = await supabase
      .from('drivers')
      .update(updateBody)
      .eq('id', editForm.id));
    if (error && editPassword && /password_sha256/.test(error.message)) {
      ({ error } = await supabase
        .from('drivers')
        .update({
          name: updateBody.name,
          phone: updateBody.phone,
          zone: updateBody.zone,
          active: updateBody.active,
        })
        .eq('id', editForm.id));
      if (!error) {
        toast({
          title: 'Updated without password',
          description:
            "Add 'password_sha256' column in Supabase to store passwords.",
        });
      }
    }
    if (error) {
      toast({ title: 'Update failed', description: error.message });
      return;
    }
    setRows((r) =>
      r.map((x) => (x.id === editForm.id ? { ...x, ...editForm } : x)),
    );
    toast({ title: 'Driver updated' });
    setEditOpen(false);
    setEditForm(null);
    setEditPassword('');
  };

  const filteredBase = useMemo(() => {
    let arr = rows;
    if (filterActive !== 'all')
      arr = arr.filter((r) =>
        filterActive === 'active' ? r.active : !r.active,
      );
    if (!query) return arr;
    const q = query.toLowerCase();
    return arr.filter((r) =>
      [r.name, r.phone, r.zone].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [rows, query, filterActive]);

  const totalPages = Math.max(1, Math.ceil(filteredBase.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBase.slice(start, start + pageSize);
  }, [filteredBase, page, pageSize]);

  const totalDrivers = rows.length;
  const activeDrivers = rows.filter((r) => r.active).length;
  const inactiveDrivers = totalDrivers - activeDrivers;
  const activeRate = totalDrivers
    ? Math.round((activeDrivers / totalDrivers) * 100)
    : 0;

  const exportCsv = () => {
    const visible = allColumns.filter(
      (c) => cols[c.key] && c.key !== 'settings',
    );
    const head = visible.map((c) => c.label).join(',');
    const body = filteredBase
      .map((r) =>
        visible
          .map((c) =>
            c.key === 'active' ? (r.active ? 'Yes' : 'No') : (r as any)[c.key],
          )
          .join(','),
      )
      .join('\n');
    const blob = new Blob([head + '\n' + body], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drivers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, phone, zone, active')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) {
        setRows(
          data.map((d: any) => ({
            id: Number(d.id),
            name: d.name || '',
            phone: d.phone || '',
            zone: d.zone || '',
            active: Boolean(d.active),
          })),
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageLayout
      title="Driver operations"
      description="Manage assignments, credentials and readiness for every field driver."
      breadcrumbs={[
        { label: 'Operations' },
        { label: 'Employees', href: '/employees' },
        { label: 'Drivers' },
      ]}
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="rounded-full border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-sm shadow-black/20 transition hover:border-white/40 hover:bg-white/20"
            onClick={exportCsv}
          >
            <Download className="mr-2 h-4 w-4" /> Export roster
          </Button>
          <Button
            className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add driver
          </Button>
        </div>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Total drivers',
              value: totalDrivers.toLocaleString(),
              detail: 'Rostered accounts across all regions.',
            },
            {
              label: 'Active',
              value: activeDrivers.toLocaleString(),
              detail: `${activeRate}% ready for dispatch.`,
            },
            {
              label: 'Inactive',
              value: inactiveDrivers.toLocaleString(),
              detail: 'Require follow-up or reactivation.',
            },
          ].map((metric) => (
            <GlassCard
              key={metric.label}
              className="flex flex-col gap-2 border-white/10 bg-white/[0.07] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold text-white">{metric.value}</p>
              <p className="text-xs text-slate-200/70">{metric.detail}</p>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <GlassCard className="space-y-6 border-white/10 bg-white/[0.06] p-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200/80">
              Roster filters
            </h2>
            <p className="text-xs text-slate-200/60">
              Focus on status, adjust pagination and search across the roster.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                className={cn(
                  'rounded-full border-white/20 bg-transparent text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-sky-400 hover:text-white',
                  filterActive === status &&
                    'border-sky-400/60 bg-sky-500/20 text-white shadow-[0_0_18px_rgba(56,189,248,0.35)]',
                )}
                onClick={() => {
                  setPage(1);
                  setFilterActive(status);
                }}
              >
                {status === 'all'
                  ? 'All status'
                  : status === 'active'
                  ? 'Active'
                  : 'Inactive'}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="driver-search"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70"
            >
              Search roster
            </Label>
            <Input
              id="driver-search"
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Search by name, phone or zone"
              className="h-10 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="page-size"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70"
            >
              Rows per page
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full border-white/20 bg-white/10 text-sm text-white focus:ring-sky-400">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                {[10, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200/70">
            <p>
              Export includes the currently filtered roster. Adjust filters to
              share tailored briefings with regional supervisors.
            </p>
          </div>
        </GlassCard>
        <div className="space-y-4">
          <GlassCard className="overflow-hidden border-white/10 bg-white/[0.04] p-0">
            <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Roster overview</h2>
                <p className="text-xs text-slate-200/70">
                  Showing the latest crew updates synchronized from Supabase.
                </p>
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-200/60">
                {current.length} / {filteredBase.length} visible
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/[0.06] text-xs uppercase tracking-[0.2em] text-slate-100">
                    {cols.name && (
                      <TableHead className="border-none text-slate-100">Name</TableHead>
                    )}
                    {cols.phone && (
                      <TableHead className="border-none text-slate-100">Phone</TableHead>
                    )}
                    {cols.zone && (
                      <TableHead className="border-none text-slate-100">Zone</TableHead>
                    )}
                    {cols.active && (
                      <TableHead className="border-none text-slate-100">Status</TableHead>
                    )}
                    {cols.settings && (
                      <TableHead className="border-none text-right text-slate-100">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-b border-white/5 bg-white/[0.02] text-sm text-slate-100 transition hover:bg-white/[0.08]"
                    >
                      {cols.name && (
                        <TableCell className="whitespace-nowrap font-semibold text-white">
                          {r.name}
                        </TableCell>
                      )}
                      {cols.phone && (
                        <TableCell className="text-slate-200/80">
                          {r.phone || '—'}
                        </TableCell>
                      )}
                      {cols.zone && (
                        <TableCell>
                          {r.zone ? (
                            <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100">
                              {r.zone}
                            </Badge>
                          ) : (
                            <span className="text-slate-200/60">Not assigned</span>
                          )}
                        </TableCell>
                      )}
                      {cols.active && (
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                              r.active
                                ? 'bg-emerald-500/15 text-emerald-200'
                                : 'bg-rose-500/10 text-rose-200',
                            )}
                          >
                            <span className="flex h-2 w-2 rounded-full bg-current" />
                            {r.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                      )}
                      {cols.settings && (
                        <TableCell className="space-x-1 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-slate-200 transition hover:bg-white/20 hover:text-white"
                            aria-label="Edit driver"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-slate-200 transition hover:bg-white/20 hover:text-white"
                            aria-label="View details"
                            onClick={() => openView(r)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {current.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={allColumns.length}
                        className="py-10 text-center text-sm text-slate-200/70"
                      >
                        No drivers match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 text-xs text-slate-200/70 md:flex-row md:items-center md:justify-between">
              <div>
                Showing{' '}
                <span className="font-semibold text-white">{current.length}</span> of{' '}
                <span className="font-semibold text-white">{filteredBase.length}</span> drivers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/20 bg-transparent px-4 text-white transition hover:border-white/40 hover:bg-white/10 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="tabular-nums text-sm text-white/80">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/20 bg-transparent px-4 text-white transition hover:border-white/40 hover:bg-white/10 disabled:opacity-40"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Add driver
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="d-name" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                Name
              </Label>
              <Input
                id="d-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Driver name"
                className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
              {addErrors.name && (
                <span className="text-xs text-rose-300">Name is required</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="d-phone" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                Phone
              </Label>
              <Input
                id="d-phone"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, phone: e.target.value }))
                }
                placeholder="Contact number"
                className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="d-zone" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                Zone
              </Label>
              <Input
                id="d-zone"
                value={addForm.zone}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, zone: e.target.value }))
                }
                placeholder="Assigned region"
                className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="d-pass" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                Password (optional)
              </Label>
              <Input
                id="d-pass"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Temporary password"
                className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                  Active status
                </p>
                <p className="text-xs text-slate-200/60">
                  Toggle to immediately activate portal credentials.
                </p>
              </div>
              <Switch
                id="d-active"
                checked={addForm.active}
                onCheckedChange={(v) =>
                  setAddForm((s) => ({ ...s, active: !!v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-white/20 bg-transparent px-5 text-white hover:border-white/40 hover:bg-white/10"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-sky-500 px-6 text-white hover:bg-sky-400"
              onClick={handleAdd}
            >
              Save driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              Driver details
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-200/70">Name</p>
                <p className="mt-1 text-white">{viewing.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-200/70">Phone</p>
                <p className="mt-1 text-slate-200/80">
                  {viewing.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-200/70">Zone</p>
                <p className="mt-1 text-slate-200/80">
                  {viewing.zone || 'Not assigned'}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                  Status
                </p>
                {viewing.active ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-200">
                    <XCircle className="h-4 w-4" /> Inactive
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              Edit driver
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="e-name" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                  Name
                </Label>
                <Input
                  id="e-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, name: e.target.value } : s))
                  }
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-phone" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                  Phone
                </Label>
                <Input
                  id="e-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, phone: e.target.value } : s))
                  }
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-zone" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                  Zone
                </Label>
                <Input
                  id="e-zone"
                  value={editForm.zone}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, zone: e.target.value } : s))
                  }
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-pass" className="text-xs uppercase tracking-[0.25em] text-slate-200/70">
                  New password (optional)
                </Label>
                <Input
                  id="e-pass"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                    Active status
                  </p>
                  <p className="text-xs text-slate-200/60">
                    Toggle to keep the driver available for assignments.
                  </p>
                </div>
                <Switch
                  id="e-active"
                  checked={editForm.active}
                  onCheckedChange={(v) =>
                    setEditForm((s) => (s ? { ...s, active: !!v } : s))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-white/20 bg-transparent px-5 text-white hover:border-white/40 hover:bg-white/10"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-sky-500 px-6 text-white hover:bg-sky-400"
              onClick={handleEditSave}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
