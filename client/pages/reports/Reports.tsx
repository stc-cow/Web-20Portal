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
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SettingsRow = {
  id?: number;
  fuel_unit_price?: number | null;
  vat_rate?: number | null;
  supplier_name?: string | null;
  supplier_address?: string | null;
  invoice_prefix?: string | null;
  invoice_sequence?: number | null;
};

type InvoiceLine = {
  taskId: number;
  siteName: string;
  region: string;
  date: string;
  liters: number;
  unitPrice: number;
  linePrice: number;
};

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [siteQuery, setSiteQuery] = useState('');
  const [region, setRegion] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [settings, setSettings] = useState<Required<SettingsRow>>({
    fuel_unit_price: 0.63,
    vat_rate: 0.15,
    supplier_name: 'Supplier',
    supplier_address: '',
    invoice_prefix: 'INV-SEC-',
    invoice_sequence: 1,
    id: 1,
  });

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.linePrice, 0),
    [lines],
  );
  const total = useMemo(
    () => subtotal * (1 + (settings.vat_rate ?? 0)),
    [subtotal, settings],
  );

  const lineCount = lines.length;
  const uniqueSites = useMemo(
    () => new Set(lines.map((l) => l.siteName)).size,
    [lines],
  );

  const loadSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettings((s) => ({
        id: Number(data.id ?? 1),
        fuel_unit_price: Number(data.fuel_unit_price ?? s.fuel_unit_price),
        vat_rate: Number(data.vat_rate ?? s.vat_rate),
        supplier_name: data.supplier_name ?? s.supplier_name,
        supplier_address: data.supplier_address ?? s.supplier_address,
        invoice_prefix: data.invoice_prefix ?? s.invoice_prefix,
        invoice_sequence: Number(data.invoice_sequence ?? s.invoice_sequence),
      }));
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSettings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const load = async () => {
    const { data: tasks } = await supabase
      .from('driver_tasks')
      .select('id, site_name, zone')
      .eq('admin_status', 'approved');

    const taskIds = (tasks ?? []).map((t: any) => Number(t.id));
    if (taskIds.length === 0) {
      setLines([]);
      return;
    }

    const filters: any[] = [{ column: 'task_id', op: 'in', value: taskIds }];
    const q = supabase
      .from('driver_task_entries')
      .select('task_id, liters, submitted_at');
    if (fromDate) q.gte('submitted_at', new Date(fromDate).toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      q.lte('submitted_at', end.toISOString());
    }
    const { data: entries } = await q;

    const byTask: Record<number, { liters: number; last: string | null }> = {};
    for (const e of entries ?? []) {
      const id = Number((e as any).task_id);
      const l = Number((e as any).liters ?? 0);
      byTask[id] = byTask[id] || { liters: 0, last: null };
      byTask[id].liters += l;
      const ts = (e as any).submitted_at as string;
      if (!byTask[id].last || ts > byTask[id].last) byTask[id].last = ts;
    }

    const unit = Number(settings.fuel_unit_price || 0);
    const mapped: InvoiceLine[] = (tasks ?? [])
      .map((t: any) => {
        const agg = byTask[Number(t.id)] || { liters: 0, last: null };
        return {
          taskId: Number(t.id),
          siteName: t.site_name || '',
          region: t.zone || '',
          date: (agg.last ?? '').slice(0, 10),
          liters: agg.liters,
          unitPrice: unit,
          linePrice: agg.liters * unit,
        };
      })
      .filter((l) =>
        siteQuery
          ? l.siteName.toLowerCase().includes(siteQuery.toLowerCase())
          : true,
      )
      .filter((l) => (region ? l.region === region : true))
      .filter((l) => l.liters > 0);

    setLines(mapped);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, siteQuery, region, settings.fuel_unit_price]);

  const exportCsv = async () => {
    const invNo = `${settings.invoice_prefix || 'INV-'}${String(settings.invoice_sequence || 1).padStart(4, '0')}`;
    const head = [
      'Invoice No',
      'Supplier',
      'From',
      'To',
      'Site Name',
      'Region',
      'Date',
      'Liters',
      'Unit Price',
      'Line Price',
      'Subtotal',
      'VAT Rate',
      'Total With VAT',
    ].join(',');

    const rows = lines
      .map((l) => [
        invNo,
        settings.supplier_name,
        fromDate,
        toDate,
        l.siteName,
        l.region,
        l.date,
        l.liters,
        l.unitPrice,
        l.linePrice,
      ])
      .map((arr) => arr.join(','));

    const totalsRow = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      subtotal,
      settings.vat_rate,
      total,
    ].join(',');

    const blob = new Blob([head + '\n' + rows.join('\n') + '\n' + totalsRow], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invNo}_${fromDate || 'all'}_${toDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      await supabase
        .from('settings')
        .update({ invoice_sequence: (settings.invoice_sequence || 1) + 1 })
        .eq('id', settings.id || 1);
      setSettings((s) => ({
        ...s,
        invoice_sequence: (s.invoice_sequence || 1) + 1,
      }));
    } catch {}
  };

  return (
    <PageLayout
      title="Billing intelligence"
      description="Aggregate driver task entries into finance-ready invoice reports."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Reports' }]}
      actions={
        <Button
          onClick={exportCsv}
          className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400"
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Invoice lines',
              value: lineCount.toLocaleString(),
              description: 'Filtered task entries included in this export.',
            },
            {
              label: 'Subtotal',
              value: subtotal.toLocaleString(undefined, {
                style: 'currency',
                currency: 'SAR',
              }),
              description: 'Fuel charges before VAT.',
            },
            {
              label: 'Total with VAT',
              value: total.toLocaleString(undefined, {
                style: 'currency',
                currency: 'SAR',
              }),
              description: `${uniqueSites} site${uniqueSites === 1 ? '' : 's'} represented.`,
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
                <p className="mt-1 text-2xl font-semibold text-white">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-slate-200/70">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <Card className="rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-xl backdrop-blur">
        <CardContent className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200/70">
            Fuel supplier invoice
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                From date
              </div>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                To date
              </div>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Site
              </div>
              <Input
                value={siteQuery}
                onChange={(e) => setSiteQuery(e.target.value)}
                placeholder="Filter by site name"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Region/Zone
              </div>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. East"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.08] text-xs uppercase tracking-[0.2em] text-slate-100">
                  <TableHead className="border-none text-slate-100">
                    Site Name
                  </TableHead>
                  <TableHead className="border-none text-slate-100">
                    Region
                  </TableHead>
                  <TableHead className="border-none text-slate-100">
                    Date
                  </TableHead>
                  <TableHead className="border-none text-slate-100">
                    Liters
                  </TableHead>
                  <TableHead className="border-none text-slate-100">
                    Unit Price
                  </TableHead>
                  <TableHead className="border-none text-slate-100">
                    Line Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-200/70"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
                {lines.map((l, i) => (
                  <TableRow
                    key={`${l.taskId}-${i}`}
                    className="border-b border-white/5 bg-white/[0.02] text-sm text-slate-100 hover:bg-white/[0.08]"
                  >
                    <TableCell className="font-semibold text-white">
                      {l.siteName}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {l.region}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {l.date}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {l.liters.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {l.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {l.linePrice.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/80 md:grid-cols-3">
            <div>Subtotal: {subtotal.toFixed(2)}</div>
            <div>
              VAT ({((settings.vat_rate ?? 0) * 100).toFixed(0)}%):{' '}
              {(subtotal * (settings.vat_rate ?? 0)).toFixed(2)}
            </div>
            <div className="font-semibold text-white">
              Total with VAT: {total.toFixed(2)}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
              onClick={exportCsv}
            >
              <Download className="mr-2 h-4 w-4" /> Export invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
