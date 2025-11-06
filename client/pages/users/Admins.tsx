import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Download,
  Columns2,
  Pencil,
  Trash2,
  Eye,
  UploadCloud,
} from 'lucide-react';

type Admin = {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  position: 'Admin' | 'User';
};

const initialAdmins: Admin[] = [
  {
    id: 1,
    name: 'Administrator',
    username: 'Bannaga',
    email: 'admin@aces-sa.com',
    password: 'Aces@6343',
    position: 'Admin',
  },
];

const allColumns = [
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password' },
  { key: 'position', label: 'Position' },
  { key: 'settings', label: 'Settings', sticky: true },
] as const;

type ColumnKey = (typeof allColumns)[number]['key'];

type AdminForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  position: 'Admin' | 'User';
};

const emptyForm: AdminForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  position: 'User',
};

export default function AdminUsersPage() {
  const STORAGE_KEY = 'app.admins';
  const [query, setQuery] = useState('');
  const [cols, setCols] = useState<Record<ColumnKey, boolean>>({
    name: true,
    username: true,
    email: true,
    password: true,
    position: true,
    settings: true,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<Admin[]>(initialAdmins);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AdminForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<
    Partial<Record<keyof AdminForm, string>>
  >({});

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<(Admin & { index: number }) | null>(
    null,
  );

  async function syncAdmins() {
    try {
      if (rows.length === 0) {
        toast({ title: 'No results' });
        return;
      }
      const payload = rows.map((r) => ({
        name: r.name,
        username: r.username,
        email: r.email,
        password: r.password,
        position: r.position,
      }));
      const { error } = await supabase
        .from('admins')
        .upsert(payload, { onConflict: 'username' });
      if (error) {
        toast({ title: 'Sync failed', description: error.message });
        return;
      }
      const { data } = await supabase
        .from('admins')
        .select('id, name, username, email, password, position')
        .order('id', { ascending: false });
      if (data) {
        setRows(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            username: d.username,
            email: d.email,
            password: d.password,
            position: d.position,
          })),
        );
      }
      toast({ title: 'Synced to Supabase' });
    } catch (e: any) {
      toast({ title: 'Sync failed', description: String(e?.message || e) });
    }
  }

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.username, r.email, r.position].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const exportCsv = () => {
    const visible = allColumns.filter(
      (c) => cols[c.key] && !['settings', 'password'].includes(c.key),
    );
    const head = visible.map((c) => c.label).join(',');
    const body = filtered
      .map((r) => visible.map((c) => (r as any)[c.key]).join(','))
      .join('\n');
    const blob = new Blob([head + '\n' + body], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateForm = (form: AdminForm) => {
    const errs: Partial<Record<keyof AdminForm, string>> = {};
    if (!form.name.trim()) errs.name = 'required';
    if (!form.username.trim()) errs.username = 'required';
    if (!form.email.trim()) errs.email = 'required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'invalidEmail';
    if (!form.password.trim()) errs.password = 'required';
    if (!form.position) errs.position = 'required';
    return errs;
  };

  const handleAdd = async () => {
    const errs = validateForm(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const { data, error } = await supabase
      .from('admins')
      .insert({
        name: addForm.name,
        username: addForm.username,
        email: addForm.email,
        password: addForm.password,
        position: addForm.position,
      })
      .select('id, name, username, email, password, position')
      .single();
    if (!error && data) {
      try {
        await supabase.auth.signUp({
          email: addForm.email,
          password: addForm.password,
        });
      } catch {}
      setRows((r) => [
        {
          id: data.id as number,
          name: data.name,
          username: data.username,
          email: data.email,
          password: data.password,
          position: data.position as any,
        },
        ...r,
      ]);
      toast({ title: 'Admin created' });
      setAddForm(emptyForm);
      setAddOpen(false);
      return;
    }
    toast({
      title: 'Supabase unavailable',
      description: 'Could not save. Try again later.',
    });
  };

  const openEdit = (row: Admin, index: number) => {
    setEditForm({ ...row, index });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    const errs = validateForm({
      name: editForm.name,
      username: editForm.username,
      email: editForm.email,
      password: editForm.password,
      position: editForm.position,
    });
    if (Object.keys(errs).length > 0) return;
    const { error } = await supabase
      .from('admins')
      .update({
        name: editForm.name,
        username: editForm.username,
        email: editForm.email,
        password: editForm.password,
        position: editForm.position,
      })
      .eq('id', editForm.id);
    if (!error) {
      setRows((r) => {
        const copy = r.slice();
        copy[editForm.index] = {
          id: editForm.id,
          name: editForm.name,
          username: editForm.username,
          email: editForm.email,
          password: editForm.password,
          position: editForm.position,
        };
        return copy;
      });
      setEditOpen(false);
      setEditForm(null);
    }
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, username, email, password, position')
        .order('id', { ascending: false });
      if (!error && data) {
        setRows(
          data.map((d) => ({
            id: d.id as number,
            name: d.name as string,
            username: d.username as string,
            email: d.email as string,
            password: d.password as string,
            position: d.position as any,
          })),
        );
      } else {
        setRows([]);
      }
    })();
  }, []);

  const { t } = useI18n();
  const totalAdmins = rows.length;
  const privilegedAdmins = rows.filter((r) => r.position === 'Admin').length;
  const standardMembers = totalAdmins - privilegedAdmins;

  return (
    <PageLayout
      title="Administrative accounts"
      description="Govern platform access with granular permissions, credential lifecycle controls and secure provisioning."
      breadcrumbs={[{ label: t('usersAuth') }, { label: t('adminUsers') }]}
      actions={
        <Button
          className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> {t('add')}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Total admins',
            value: totalAdmins.toLocaleString(),
            description: 'Active directory users synced from Supabase.',
          },
          {
            label: 'Privileged roles',
            value: privilegedAdmins.toLocaleString(),
            description: 'Accounts with elevated approval authority.',
          },
          {
            label: 'Standard members',
            value: standardMembers.toLocaleString(),
            description: 'Limited-scope operators and auditors.',
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
              {t('manageAdminsIntro')}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                onClick={exportCsv}
              >
                <Download className="mr-2 h-4 w-4" /> {t('export')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10">
                    <Columns2 className="mr-2 h-4 w-4" /> {t('columns')}
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
                      disabled={c.key === 'settings'}
                    >
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                onClick={syncAdmins}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> {t('sync')}
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-white/10 bg-white/5 p-0">
          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                {t('excelPrintColumnVisibility')}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                  placeholder={t('search') ?? 'Search'}
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
                        {t('name')}
                      </TableHead>
                    )}
                    {cols.username && (
                      <TableHead className="border-none text-slate-100">
                        {t('username')}
                      </TableHead>
                    )}
                    {cols.email && (
                      <TableHead className="border-none text-slate-100">
                        {t('email')}
                      </TableHead>
                    )}
                    {cols.password && (
                      <TableHead className="border-none text-slate-100">
                        {t('password')}
                      </TableHead>
                    )}
                    {cols.position && (
                      <TableHead className="border-none text-slate-100">
                        {t('position')}
                      </TableHead>
                    )}
                    {cols.settings && (
                      <TableHead className="border-none text-right text-slate-100">
                        {t('settingsCol')}
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
                        {t('noResults')}
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
                      {cols.username && (
                        <TableCell className="text-slate-200/80">
                          {r.username}
                        </TableCell>
                      )}
                      {cols.email && (
                        <TableCell className="text-slate-200/80">
                          {r.email}
                        </TableCell>
                      )}
                      {cols.password && (
                        <TableCell className="text-slate-200/80">*******</TableCell>
                      )}
                      {cols.position && (
                        <TableCell className="text-slate-200/80">
                          {r.position}
                        </TableCell>
                      )}
                      {cols.settings && (
                        <TableCell className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" className="text-slate-200 hover:text-white" aria-label="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-200 hover:text-white"
                            aria-label="Edit"
                            onClick={() =>
                              openEdit(
                                r,
                                rows.findIndex((x) => x.id === r.id),
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-rose-200 hover:text-rose-100"
                            aria-label="Delete"
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
                {t('showing')} {current.length} {t('of')} {filtered.length}{' '}
                {t('entries')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('prev')}
                </Button>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-200/60">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle>{t('addUser')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
              {addErrors.name && (
                <p className="text-xs text-rose-300">{t(addErrors.name)}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">{t('username')}</Label>
              <Input
                id="username"
                value={addForm.username}
                onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
              {addErrors.username && (
                <p className="text-xs text-rose-300">{t(addErrors.username)}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
              {addErrors.email && (
                <p className="text-xs text-rose-300">{t(addErrors.email)}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
              {addErrors.password && (
                <p className="text-xs text-rose-300">{t(addErrors.password)}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>{t('position')}</Label>
              <Select
                value={addForm.position}
                onValueChange={(v) => setAddForm((f) => ({ ...f, position: v as any }))}
              >
                <SelectTrigger className="mt-2 h-10 border-white/20 bg-white/10 text-white focus:ring-sky-400">
                  <SelectValue placeholder={t('position')} />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                  <SelectItem value="Admin">{t('admin')}</SelectItem>
                  <SelectItem value="User">{t('user')}</SelectItem>
                </SelectContent>
              </Select>
              {addErrors.position && (
                <p className="mt-2 text-xs text-rose-300">{t(addErrors.position)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
              onClick={() => setAddOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              className="rounded-full bg-emerald-500 px-5 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
              onClick={handleAdd}
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t('name')}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => (f ? { ...f, name: e.target.value } : f))
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">{t('username')}</Label>
                <Input
                  id="edit-username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, username: e.target.value } : f,
                    )
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, email: e.target.value } : f,
                    )
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">{t('password')}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, password: e.target.value } : f,
                    )
                  }
                  className="border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
                />
              </div>
              <div className="md:col-span-2">
                <Label>{t('position')}</Label>
                <Select
                  value={editForm.position}
                  onValueChange={(v) =>
                    setEditForm((f) => (f ? { ...f, position: v as any } : f))
                  }
                >
                  <SelectTrigger className="mt-2 h-10 border-white/20 bg-white/10 text-white focus:ring-sky-400">
                    <SelectValue placeholder={t('position')} />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                    <SelectItem value="Admin">{t('admin')}</SelectItem>
                    <SelectItem value="User">{t('user')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 px-4 text-white hover:border-white/30 hover:bg-white/10"
              onClick={() => setEditOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              className="rounded-full bg-emerald-500 px-5 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
              onClick={handleEditSave}
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
