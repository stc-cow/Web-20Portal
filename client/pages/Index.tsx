import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { useKpis, useRegionLitersTotal } from '@/hooks/useDashboard';

export default function Index() {
  const { t } = useI18n();
  const { data: kpis } = useKpis();
  const { data: regionTotals } = useRegionLitersTotal();

  return (
    <AppShell>
      <Header />
      <div className="px-4 pb-10 pt-4">
        <div className="mb-4 text-sm text-muted-foreground">{t('dashboard')}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t('litersToday')} value={formatNum(kpis?.litersToday)} />
          <KpiCard label={t('liters30d')} value={formatNum(kpis?.liters30d)} />
          <KpiCard label={t('activeMissions')} value={formatNum(kpis?.activeMissions)} />
          <KpiCard label={t('activeDrivers')} value={formatNum(kpis?.activeDrivers)} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">{t('regionTotals')}</div>
              <div className="mt-3 text-3xl font-semibold">
                {t('central')}: {formatNum(regionTotals?.central)}
              </div>
              <div className="mt-1 text-3xl font-semibold">
                {t('east')}: {formatNum(regionTotals?.east)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-muted-foreground">
                {t('welcome')} · {t('navigateSidebar')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function formatNum(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return new Intl.NumberFormat().format(v);
}
