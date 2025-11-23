import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useMemo, useState } from 'react';
import {
  Columns2,
  Download,
  Printer,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type GeneratorRow = {
  id: number;
  name: string;
  site: string;
  dailyVirtual: number;
  lastAvg: number;
  rateOk: boolean;
  active: boolean;
};

const initialRows: GeneratorRow[] = [
  {
    id: 1,
    name: '3172',
    site: 'SGD66662',
    dailyVirtual: 100,
    lastAvg: 400,
    rateOk: true,
    active: true,
  },
  {
    id: 2,
    name: '2371',
    site: 'COWM38',
    dailyVirtual: 95,
    lastAvg: 0,
    rateOk: false,
    active: true,
  },
  {
    id: 3,
    name: '2370',
    site: 'COW531',
    dailyVirtual: 100,
    lastAvg: 50,
    rateOk: true,
    active: true,
  },
  {
    id: 4,
    name: '2368',
    site: 'COW591',
    dailyVirtual: 100,
    lastAvg: 20,
    rateOk: false,
    active: true,
  },
  {
    id: 5,
    name: '2367',
    site: 'A-25462C',
    dailyVirtual: 100,
    lastAvg: 0,
    rateOk: false,
    active: true,
  },
  {
    id: 6,
    name: '2366',
    site: 'COW63',
    dailyVirtual: 100,
    lastAvg: 100,
    rateOk: true,
    active: false,
  },
];

const allColumns = [
  { key: 'name', label: 'Name' },
  { key: 'site', label: 'Site' },
  { key: 'dailyVirtual', label: 'Daily virtual consumption' },
  { key: 'lastAvg', label: 'Last average consumption' },
  { key: 'rateOk', label: 'Rate' },
  { key: 'active', label: 'Active' },
  { key: 'settings', label: 'Settings' },
] as const;

type ColumnKey = (typeof allColumns)[number]['key'];

export default function GeneratorsPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<GeneratorRow[]>(initialRows);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cols, setCols] = useState<Record<ColumnKey, boolean>>({
    name: true,
    site: true,
    dailyVirtual: true,
    lastAvg: true,
    rateOk: true,
    active: true,
    settings: true,
  });
  const [onlyWithoutSite, setOnlyWithoutSite] = useState(false);

  const filtered = useMemo(() => {
    let data = rows;
    if (onlyWithoutSite) data = data.filter((r) => !r.site || r.site === '-');
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((r) =>
      [r.name, r.site].some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query, onlyWithoutSite]);

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
          .map((c) => {
            const key = c.key as keyof GeneratorRow;
            const v = (r as any)[key];
            if (key === 'active') return r.active ? 'Yes' : 'No';
            if (key === 'rateOk') return r.rateOk ? 'OK' : 'Alert';
            return v;
          })
          .join(','),
      )
      .join('\n');
    const blob = new Blob([head + '\n' + body], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generators.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = (id: number) => setRows((r) => r.filter((x) => x.id !== id));

  const totalGenerators = rows.length;
  const activeGenerators = rows.filter((r) => r.active).length;
  const generatorsWithoutSite = rows.filter(
    (r) => !r.site || r.site === '-',
  ).length;

  return (
    <PageLayout
      title="Generator performance"
      description="Monitor fleet readiness, runtime health and assignments across every deployed generator."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Generators' }]}
      actions={
        <Button className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30">
          <Plus className="mr-2 h-4 w-4" /> Add generator
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Total generators',
            value: totalGenerators.toLocaleString(),
            description: 'Includes every unit synced from the last refresh.',
          },
          {
            label: 'Active & fueled',
            value: activeGenerators.toLocaleString(),
            description: 'Currently reporting online status.',
          },
          {
            label: 'Awaiting site pairing',
            value: generatorsWithoutSite.toLocaleString(),
            description: 'Units missing an assigned deployment site.',
          }].map((metric) => (
            <GlassCard
              key={metric.label}
              className="border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-700">{metric.description}</p>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <GlassCard className="border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-700">
              Fine-tune generator visibility, export manifests and print onsite runbooks.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full border border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400 hover:bg-slate-100"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" /> Print summary
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400 hover:bg-slate-100"
                onClick={exportCsv}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'rounded-full border border-slate-300 px-4 text-slate-900 transition hover:border-slate-400 hover:bg-slate-100',
                  onlyWithoutSite
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400'
                    : 'bg-slate-50',
                )}
                onClick={() => setOnlyWithoutSite((v) => !v)}
              >
                Without site
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full border border-slate-300 bg-slate-50 px-4 text-slate-900 hover:border-slate-400 hover:bg-slate-100">
                    <Columns2 className="mr-2 h-4 w-4" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border border-slate-300 bg-white text-slate-900"
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

        <GlassCard className="border-slate-200 bg-white p-0">
          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                Fleet roster
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search generators"
                  className="h-10 min-w-[200px] border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:ring-sky-500"
                />
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-10 w-[130px] border-slate-300 bg-slate-50 text-slate-900 focus:ring-sky-500">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-300 bg-white text-slate-900">
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
              <Table className="min-w-full text-slate-900">
                <TableHeader>
                  <TableRow className="bg-slate-100 text-xs uppercase tracking-[0.2em] text-slate-900">
                    {allColumns.map((column) =>
                      cols[column.key] ? (
                        <TableHead key={column.key} className="border-none text-slate-900">
                          {column.label}
                        </TableHead>
                      ) : null,
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={allColumns.length}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No generators match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {current.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-slate-200 bg-white text-sm text-slate-900 transition hover:bg-slate-50"
                    >
                      {cols.name && (
                        <TableCell className="font-semibold text-slate-900">
                          {row.name}
                        </TableCell>
                      )}
                      {cols.site && (
                        <TableCell className="text-slate-700">
                          {row.site || '—'}
                        </TableCell>
                      )}
                      {cols.dailyVirtual && (
                        <TableCell className="text-slate-700">
                          {row.dailyVirtual.toLocaleString()}
                        </TableCell>
                      )}
                      {cols.lastAvg && (
                        <TableCell className="text-slate-700">
                          {row.lastAvg.toLocaleString()}
                        </TableCell>
                      )}
                      {cols.rateOk && (
                        <TableCell>
                          {row.rateOk ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
                              <XCircle className="h-4 w-4" /> Alert
                            </span>
                          )}
                        </TableCell>
                      )}
                      {cols.active && (
                        <TableCell>
                          {row.active ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                              <CheckCircle2 className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
                              <XCircle className="h-4 w-4" /> Offline
                            </span>
                          )}
                        </TableCell>
                      )}
                      {cols.settings && (
                        <TableCell className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-200 hover:text-rose-100"
                            onClick={() => remove(row.id)}
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

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
              <div>
                Showing {current.length} of {filtered.length} generators
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full border border-slate-300 bg-slate-50 px-4 text-slate-900 hover:border-slate-400 hover:bg-slate-100"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="rounded-full border border-slate-300 bg-slate-50 px-4 text-slate-900 hover:border-slate-400 hover:bg-slate-100"
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
    </PageLayout>
  );
}
