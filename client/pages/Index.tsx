import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { useKpis, useFuelTrend } from '@/hooks/useDashboard';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

export default function Index() {
  const { t } = useI18n();
  const { data: kpis } = useKpis();
  const { data: trend } = useFuelTrend();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('driver_tasks')
          .select('id, site_name, driver_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(6);
        if (!mounted) return;
        if (!error && Array.isArray(data)) setRecent(data);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <Header />
      <div className="px-6 pb-10 pt-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="mb-4 text-sm text-muted-foreground">{t('dashboard')}</div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard title="Fuel Level" value={formatVal(kpis?.litersToday, '%')} color="#00C853" />
          <KpiCard title="Power Usage" value={undefined} subtitle="kW" color="#003366" />
          <KpiCard title="Generator Runtime" value={undefined} subtitle="hrs" color="#FF6D00" />
        </div>

        {/* Charts + Recent */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] lg:col-span-2">
            <CardHeader className="p-6">
              <CardTitle className="text-[#003366]">Fuel Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {Array.isArray(trend) && trend.length > 0 ? (
                <AreaChart width={0} height={0} data={trend} className="w-full h-[280px]">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="liters" stroke="#003366" fill="#00C85333" />
                </AreaChart>
              ) : (
                <div className="text-sm text-muted-foreground">{t('noDataYet')}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <CardHeader className="p-6">
              <CardTitle className="text-[#003366]">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recent.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">{t('noDataYet')}</div>
                )}
                {recent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[#212121]">{r.site_name || 'Site'}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.driver_name || 'Driver'}</div>
                    </div>
                    <span className="rounded-full bg-[#003366] px-3 py-1 text-xs text-white">
                      {r.status || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value?: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <Card className="rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-[#003366] text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold" style={{ color }}>
            {value ?? '—'}
          </div>
          {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function formatVal(n?: number, suffix?: string) {
  if (!Number.isFinite(Number(n))) return undefined;
  const str = new Intl.NumberFormat().format(Number(n));
  return suffix ? `${str}${suffix}` : str;
}
