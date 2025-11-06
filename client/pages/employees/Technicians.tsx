import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  Columns2,
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type Technician = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
};

const initialRows: Technician[] = [
  { id: 1, name: 'test', phone: '513007562', active: true },
];

const allColumns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'active', label: 'Active' },
  { key: 'settings', label: 'Settings' },
] as const;

type ColumnKey = (typeof allColumns)[number]['key'];

type TechnicianForm = {
  name: string;
  phone: string;
  active: boolean;
};

const emptyForm: TechnicianForm = { name: '', phone: '', active: true };

export default function TechniciansPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Technician[]>(initialRows);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cols, setCols] = useState<Record<ColumnKey, boolean>>({
    name: true,
    phone: true,
    active: true,
    settings: true,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<TechnicianForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<
    Partial<Record<keyof TechnicianForm, string>>
  >({});

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Technician | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Technician | null>(null);

  function validate(form: TechnicianForm) {
    const errs: Partial<Record<keyof TechnicianForm, string>> = {};
    if (!form.name.trim()) errs.name = 'required';
    return errs;
  }

  const handleAdd = async () => {
    const errs = validate(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const { data, error } = await supabase
      .from('technicians')
      .insert({
        name: addForm.name,
        phone: addForm.phone || null,
        active: addForm.active,
      })
      .select('id, name, phone, active')
      .single();
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
        active: Boolean(data.active),
      },
      ...r,
    ]);
    toast({ title: 'Technician created' });
    setAddForm(emptyForm);
    setAddOpen(false);
  };

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.phone].some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const exportCsv = () => {
    const visible = allColumns.filter(
      (c) => cols[c.key] && c.key !== 'settings',
    );
    const head = visible.map((c) => c.label).join(',');
    const body = filtered
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
    a.download = 'technicians.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  };

  const openView = (row: Technician) => {
    setViewing(row);
    setViewOpen(true);
  };

  const openEdit = (row: Technician) => {
    setEditForm({ ...row });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    const errs = validate({
      name: editForm.name,
      phone: editForm.phone,
      active: editForm.active,
    });
    if (Object.keys(errs).length > 0) return;
    const { error } = await supabase
      .from('technicians')
      .update({
        name: editForm.name,
        phone: editForm.phone || null,
        active: editForm.active,
      })
      .eq('id', editForm.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message });
      return;
    }
    setRows((r) =>
      r.map((x) => (x.id === editForm.id ? { ...x, ...editForm } : x)),
    );
    toast({ title: 'Technician updated' });
    setEditOpen(false);
    setEditForm(null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('id, name, phone, active')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) {
        setRows(
          data.map((d: any) => ({
            id: Number(d.id),
            name: d.name || '',
            phone: d.phone || '',
            active: Boolean(d.active),
          })),
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalTechnicians = rows.length;
  const activeTechnicians = rows.filter((r) => r.active).length;
  const standbyTechnicians = totalTechnicians - activeTechnicians;

  return (
    <PageLayout
      title="Technician coverage"
      description="Track field specialists, their readiness and certifications with a unified, modern workspace."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Technicians' }]}
      actions={
        <Button
          className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add technician
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Total technicians',
            value: totalTechnicians.toLocaleString(),
            description: 'Rostered specialists across all regions.',
          },
          {
            label: 'Mission-ready',
            value: activeTechnicians.toLocaleString(),
            description: 'Cleared for deployment right now.',
          },
          {
            label: 'On standby',
            value: standbyTechnicians.toLocaleString(),
            description: 'Awaiting activation or certification.',
          }].map((metric) => (
            <GlassCard
              key={metric.label}
              className="border-white/10 bg-white/[0.07] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-200/70">{metric.description}</p>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <GlassCard className="border-white/10 bg-white/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-200/80">
              Manage availability, export coverage reports and audit account visibility.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                onClick={exportCsv}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10">
                    <Columns2 className="mr-2 h-4 w-4" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border border-white/10 bg-[#0b1e3e] text-slate-100"
                >
                  {allColumns.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.key}
                      checked={cols[c.key]}
                      onCheckedChange={(v) =>
                        setCols((s) => ({ ...s, [c.key]: !!v }))
                      }
                    >
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-white/10 bg-white/5 p-0">
          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                Technician roster
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                  placeholder="Search technicians"
                  className="h-10 min-w-[200px] border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-10 w-[130px] border-white/20 bg-white/10 text-white focus:ring-sky-400">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                    {[10, 25, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        Show {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-full text-slate-100">
                <TableHeader>
                  <TableRow className="bg-white/[0.08] text-xs uppercase tracking-[0.2em] text-slate-100">
                    {cols.name && (
                      <TableHead className="border-none text-slate-100">
                        Name
                      </TableHead>
                    )}
                    {cols.phone && (
                      <TableHead className="border-none text-slate-100">
                        Phone
                      </TableHead>
                    )}
                    {cols.active && (
                      <TableHead className="border-none text-slate-100">
                        Active
                      </TableHead>
                    )}
                    {cols.settings && (
                      <TableHead className="border-none text-right text-slate-100">
                        Settings
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={allColumns.length}
                        className="py-8 text-center text-sm text-slate-200/70"
                      >
                        No technicians match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {current.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-white/5 bg-white/[0.02] text-sm text-slate-100 transition hover:bg-white/[0.08]"
                    >
                      {cols.name && (
                        <TableCell className="font-semibold text-white">
                          {r.name}
                        </TableCell>
                      )}
                      {cols.phone && (
                        <TableCell className="text-slate-200/80">
                          {r.phone || '—'}
                        </TableCell>
                      )}
                      {cols.active && (
                        <TableCell>
                          {r.active ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                              <CheckCircle2 className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
                              <XCircle className="h-4 w-4" /> Inactive
                            </span>
                          )}
                        </TableCell>
                      )}
                      {cols.settings && (
                        <TableCell className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-200 hover:text-white"
                            aria-label="View technician"
                            onClick={() => openView(r)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-200 hover:text-white"
                            aria-label="Edit technician"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-rose-200 hover:text-rose-100"
                            aria-label="Remove technician"
                            onClick={() => remove(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-slate-200/70 md:flex-row md:items-center md:justify-between">
              <div>
                Showing {current.length} of {filtered.length} technicians
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-200/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle>Add technician</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="tech-name">Name</Label>
              <Input
                id="tech-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, name: e.target.value }))
                }
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
              {addErrors.name && (
                <span className="text-sm text-rose-300">required</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tech-phone">Phone</Label>
              <Input
                id="tech-phone"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, phone: e.target.value }))
                }
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Label htmlFor="tech-active" className="text-sm text-slate-100">
                Active
              </Label>
              <Switch
                id="tech-active"
                checked={addForm.active}
                onCheckedChange={(v) =>
                  setAddForm((s) => ({ ...s, active: !!v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-emerald-500 px-5 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
              onClick={handleAdd}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle>Technician details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
                  Name
                </p>
                <p className="mt-1 text-sm text-white">{viewing.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
                  Phone
                </p>
                <p className="mt-1 text-sm text-white">{viewing.phone || '—'}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
                  Status
                </span>
                {viewing.active ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
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
            <DialogTitle>Edit technician</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-tech-name">Name</Label>
                <Input
                  id="edit-tech-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, name: e.target.value } : s))
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tech-phone">Phone</Label>
                <Input
                  id="edit-tech-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, phone: e.target.value } : s))
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Label htmlFor="edit-tech-active" className="text-sm text-slate-100">
                  Active
                </Label>
                <Switch
                  id="edit-tech-active"
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
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-emerald-500 px-5 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
              onClick={handleEditSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
