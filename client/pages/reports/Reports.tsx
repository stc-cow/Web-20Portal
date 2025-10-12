import { AppShell } from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
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

  useEffect(() => {
    (async () => {
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
    })();
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
      .select('task_id, liters_added, timestamp');
    if (fromDate) q.gte('timestamp', new Date(fromDate).toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      q.lte('timestamp', end.toISOString());
    }
    const { data: entries } = await q;

    const byTask: Record<number, { liters: number; last: string | null }> = {};
    for (const e of entries ?? []) {
      const id = Number((e as any).task_id);
      const l = Number((e as any).liters_added ?? 0);
      byTask[id] = byTask[id] || { liters: 0, last: null };
      byTask[id].liters += l;
      const ts = (e as any).timestamp as string;
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
  }, [fromDate, toDate, siteQuery, region]);

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
    <AppShell>
      <Header />
      <div className="px-4 pb-10 pt-4">
        <div className="mb-4 text-sm font-bold text-[#0C2340]">
          Fuel Supplier Invoice
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">From Date</div>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">To Date</div>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Site</div>
                <Input
                  value={siteQuery}
                  onChange={(e) => setSiteQuery(e.target.value)}
                  placeholder="Filter by site name"
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Region/Zone</div>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. East"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]">
                    <TableHead className="text-white">Site Name</TableHead>
                    <TableHead className="text-white">Region</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Liters</TableHead>
                    <TableHead className="text-white">Unit Price</TableHead>
                    <TableHead className="text-white">Line Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                  {lines.map((l, i) => (
                    <TableRow key={`${l.taskId}-${i}`}>
                      <TableCell className="font-medium">
                        {l.siteName}
                      </TableCell>
                      <TableCell>{l.region}</TableCell>
                      <TableCell>{l.date}</TableCell>
                      <TableCell>{l.liters.toFixed(2)}</TableCell>
                      <TableCell>{l.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>{l.linePrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="text-sm">Subtotal: {subtotal.toFixed(2)}</div>
              <div className="text-sm">
                VAT ({((settings.vat_rate ?? 0) * 100).toFixed(0)}%):{' '}
                {(subtotal * (settings.vat_rate ?? 0)).toFixed(2)}
              </div>
              <div className="text-sm font-semibold">
                Total with VAT: {total.toFixed(2)}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <Button
                className="bg-[#E60000] hover:opacity-90"
                onClick={exportCsv}
              >
                <Download className="mr-2 h-4 w-4" /> Export Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
