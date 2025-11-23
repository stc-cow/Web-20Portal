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
import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Dashboard-mapped row
type SiteRow = {
  id: number;
  name: string; // site_name
  generator: string; // site_name
  currentLiters: string; // empty
  dailyVirtual: string; // empty
  lastAvg: string; // empty
  rate: string; // empty
  driver: string; // empty
  project: string; // constant "stc COW"
  city: string; // mapped from district
  address: string; // mapped from city
  active: boolean; // ON-AIR / In Progress => check, OFF-AIR => X
  cowStatus: string; // keep status for editing
};

const allColumns = [
  { key: 'index', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'generator', label: 'Generator' },
  { key: 'currentLiters', label: 'Current Liters in Tank' },
  { key: 'dailyVirtual', label: 'Daily virtual consumption' },
  { key: 'rate', label: 'Rate' },
  { key: 'driver', label: 'Driver' },
  { key: 'project', label: 'Project' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Address' },
  { key: 'active', label: 'Active' },
  { key: 'settings', label: 'Settings' },
] as const;

type ColumnKey = (typeof allColumns)[number]['key'];

type EditForm = {
  id: number;
  site_name: string;
  district: string;
  city: string;
  cow_status: string;
};

export default function SitesPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<SiteRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [cols] = useState<Record<ColumnKey, boolean>>({
    index: true,
    name: true,
    generator: true,
    currentLiters: true,
    dailyVirtual: true,
    rate: true,
    driver: true,
    project: true,
    city: true,
    address: true,
    active: true,
    settings: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [viewing, setViewing] = useState<SiteRow | null>(null);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.generator, r.driver, r.project, r.city, r.address].some(
        (value) => String(value).toLowerCase().includes(q),
      ),
    );
  }, [rows, query]);

  const totalSites = rows.length;
  const activeSites = useMemo(
    () => rows.filter((r) => r.active).length,
    [rows],
  );
  const inactiveSites = totalSites - activeSites;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize],
  );

  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const mapRow = (d: any): SiteRow => {
    const status = (d.cow_status || '').toString();
    const sNorm = status.trim().toLowerCase();
    const isActive = sNorm.includes('on-air') || sNorm.includes('in progress');
    return {
      id: Number(d.id),
      name: d.site_name || '',
      generator: d.site_name || '',
      currentLiters: '',
      dailyVirtual: '',
      lastAvg: '',
      rate: '',
      driver: '',
      project: 'stc COW',
      city: d.district || '',
      address: d.city || '',
      active: isActive,
      cowStatus: status,
    };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('id, site_name, district, city, cow_status')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (error || !data) {
        setRows([]);
        return;
      }
      setRows(data.map(mapRow));
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const exportCsv = () => {
    const visible = allColumns.filter(
      (c) =>
        cols[c.key] &&
        !['index', 'settings', 'active'].includes(c.key as string),
    );
    const head = visible.map((c) => c.label).join(',');
    const body = filtered
      .map((r) => visible.map((c) => (r as any)[c.key] ?? '').join(','))
      .join('\n');
    const blob = new Blob([head + '\n' + body], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `ACES_Sites_Report_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from('sites').delete().eq('id', id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  };

  const openEdit = (r: SiteRow) => {
    setEditing({
      id: r.id,
      site_name: r.name,
      district: r.city,
      city: r.address,
      cow_status: r.cowStatus,
    });
    setEditOpen(true);
  };

  const openView = (r: SiteRow) => {
    setViewing(r);
    setViewOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error, data } = await supabase
      .from('sites')
      .update({
        site_name: editing.site_name,
        district: editing.district,
        city: editing.city,
        cow_status: editing.cow_status,
      })
      .eq('id', editing.id)
      .select('id, site_name, district, city, cow_status')
      .single();
    if (!error && data) {
      setRows((r) => r.map((x) => (x.id === editing.id ? mapRow(data) : x)));
      setEditOpen(false);
      setEditing(null);
    }
  };

  return (
    <PageLayout
      title="Site intelligence"
      description="Monitor generator readiness, consumption trends and field assignments across every site."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Sites' }]}
      actions={
        <Button
          variant="outline"
          className="rounded-full border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-sm shadow-black/20 transition hover:border-white/40 hover:bg-white/20"
          onClick={exportCsv}
        >
          <Download className="mr-2 h-4 w-4" /> Export register
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Total sites',
              value: totalSites.toLocaleString(),
              description: 'Sites onboarded across all regions.',
            },
            {
              label: 'Operational',
              value: activeSites.toLocaleString(),
              description: 'Currently live or in-progress COW locations.',
            },
            {
              label: 'Needs attention',
              value: inactiveSites.toLocaleString(),
              description: 'Offline or awaiting activation follow-up.',
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
      <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-xl backdrop-blur">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="text-xs uppercase tracking-[0.25em] text-black">
              Print • Column visibility • Showing {pageSize} rows
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.25em] text-black">
                Search
              </span>
              <Input
                value={query}
                onChange={(e) => {
                  setPage(1);
                  setQuery(e.target.value);
                }}
                placeholder="Search by site or region"
                className="h-10 w-64 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.08] text-xs uppercase tracking-[0.2em] text-black">
                  {cols.index && (
                    <TableHead className="border-none text-black">#</TableHead>
                  )}
                  {cols.name && (
                    <TableHead className="border-none text-black">
                      Name
                    </TableHead>
                  )}
                  {cols.generator && (
                    <TableHead className="border-none text-black">
                      Generator
                    </TableHead>
                  )}
                  {cols.currentLiters && (
                    <TableHead className="border-none text-black">
                      Current liters in tank
                    </TableHead>
                  )}
                  {cols.dailyVirtual && (
                    <TableHead className="border-none text-black">
                      Daily virtual consumption
                    </TableHead>
                  )}
                  {cols.rate && (
                    <TableHead className="border-none text-black">
                      Rate
                    </TableHead>
                  )}
                  {cols.driver && (
                    <TableHead className="border-none text-black">
                      Driver
                    </TableHead>
                  )}
                  {cols.project && (
                    <TableHead className="border-none text-black">
                      Project
                    </TableHead>
                  )}
                  {cols.city && (
                    <TableHead className="border-none text-black">
                      City
                    </TableHead>
                  )}
                  {cols.address && (
                    <TableHead className="border-none text-black">
                      Address
                    </TableHead>
                  )}
                  {cols.active && (
                    <TableHead className="border-none text-black">
                      Status
                    </TableHead>
                  )}
                  {cols.settings && (
                    <TableHead className="border-none text-right text-black">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    className="border-b border-white/5 bg-white/[0.02] text-sm text-black transition hover:bg-white/[0.08]"
                  >
                    {cols.index && (
                      <TableCell className="font-semibold text-black">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                    )}
                    {cols.name && (
                      <TableCell className="font-semibold text-black">
                        {r.name}
                      </TableCell>
                    )}
                    {cols.generator && (
                      <TableCell className="text-black">
                        {r.generator || '—'}
                      </TableCell>
                    )}
                    {cols.currentLiters && (
                      <TableCell className="text-black">
                        {r.currentLiters || '—'}
                      </TableCell>
                    )}
                    {cols.dailyVirtual && (
                      <TableCell className="text-black">
                        {r.dailyVirtual || '—'}
                      </TableCell>
                    )}
                    {cols.rate && (
                      <TableCell className="text-black">
                        {r.rate || '—'}
                      </TableCell>
                    )}
                    {cols.driver && (
                      <TableCell className="text-black">
                        {r.driver || '—'}
                      </TableCell>
                    )}
                    {cols.project && (
                      <TableCell className="text-black">
                        {r.project || '—'}
                      </TableCell>
                    )}
                    {cols.city && (
                      <TableCell className="text-black">
                        {r.city || '—'}
                      </TableCell>
                    )}
                    {cols.address && (
                      <TableCell className="text-black">
                        {r.address || '—'}
                      </TableCell>
                    )}
                    {cols.active && (
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${r.active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/10 text-rose-200'}`}
                        >
                          <span className="flex h-2 w-2 rounded-full bg-current" />
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    )}
                    {cols.settings && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openView(r)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-black transition hover:border-white/30 hover:bg-white/15"
                            aria-label="View site"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-black transition hover:border-white/30 hover:bg-white/15"
                            aria-label="Edit site"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Remove this site?'))
                                remove(r.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-rose-200 transition hover:border-white/30 hover:bg-rose-500/10"
                            aria-label="Delete site"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {current.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={allColumns.length}
                      className="py-10 text-center text-sm text-black"
                    >
                      No results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 text-xs text-slate-200/70 md:flex-row md:items-center md:justify-between">
            <div>
              Showing{' '}
              <span className="font-semibold text-black">{current.length}</span>{' '}
              of{' '}
              <span className="font-semibold text-black">
                {filtered.length}
              </span>{' '}
              entries
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
              <span className="tabular-nums text-sm text-black">
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
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg border border-white/10 bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              Site details
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-black">
                  Name
                </p>
                <p className="mt-1 text-black">{viewing.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-black">
                  City
                </p>
                <p className="mt-1 text-black">{viewing.city}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-black">
                  Address
                </p>
                <p className="mt-1 text-black">{viewing.address}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.25em] text-black">
                  Status
                </span>
                {viewing.active ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-black">
                    <CheckCircle2 className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-black">
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
              Edit site
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="site_name"
                  className="text-xs uppercase tracking-[0.25em] text-black"
                >
                  Name (Site name)
                </Label>
                <Input
                  id="site_name"
                  value={editing.site_name}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, site_name: e.target.value } : s,
                    )
                  }
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div>
                <Label
                  htmlFor="district"
                  className="text-xs uppercase tracking-[0.25em] text-black"
                >
                  District
                </Label>
                <Input
                  id="district"
                  value={editing.district}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, district: e.target.value } : s,
                    )
                  }
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div>
                <Label
                  htmlFor="city"
                  className="text-xs uppercase tracking-[0.25em] text-black"
                >
                  City
                </Label>
                <Input
                  id="city"
                  value={editing.city}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, city: e.target.value } : s))
                  }
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
              <div>
                <Label
                  htmlFor="cow_status"
                  className="text-xs uppercase tracking-[0.25em] text-black"
                >
                  COW status
                </Label>
                <Input
                  id="cow_status"
                  value={editing.cow_status}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, cow_status: e.target.value } : s,
                    )
                  }
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="rounded-full border-white/20 bg-transparent px-5 text-white hover:border-white/40 hover:bg-white/10"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-sky-500 px-6 text-black hover:bg-sky-400"
              onClick={saveEdit}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
