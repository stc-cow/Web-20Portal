import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import {
  useKpis,
  useRegionLitersTotal,
  useRegionLitersPie,
  useMissionCategoryPie,
} from '@/hooks/useDashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#002D62', '#E30613', '#0070C0', '#6C757D'];

export default function Index() {
  const { t } = useI18n();
  const { data: kpis } = useKpis();
  const { data: regionTotals } = useRegionLitersTotal();
  const { data: regionPie } = useRegionLitersPie();
  const { data: missionPie } = useMissionCategoryPie();

  return (
    <AppShell>
      <Header />
      <div className="px-6 pb-10 pt-4">
        <div className="mb-4 flex items-center justify-center">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F88c65af5aa594e4eb74b03e70886ef92?format=webp&width=1200"
            alt="ACES Managed Services"
            className="h-auto w-[180px] drop-shadow-[0_0_10px_rgba(0,0,0,0.12)]"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Liters Added Today"
            value={kpis?.litersToday}
            color="#E30613"
            suffix=" L"
          />
          <MetricCard
            title="Total Liters Added (30 Days)"
            value={kpis?.liters30d}
            color="#003366"
            suffix=" L"
          />
          <MetricCard
            title="Central"
            value={regionTotals?.central}
            color="#0070C0"
            suffix=" L"
          />
          <MetricCard
            title="East"
            value={regionTotals?.east}
            color="#E30613"
            suffix=" L"
          />
        </div>

        {/* Donut charts */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card className="rounded-2xl shadow-[0_2px_6px_rgba(0,45,98,0.1)]">
            <CardHeader className="p-6">
              <CardTitle className="text-[#002D62]">
                Fuel Added by Region
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionPie || []}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(e: any) => `${e.name} (${formatNum(e.value)}L)`}
                    >
                      {(regionPie || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${formatNum(v)} L`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-[0_2px_6px_rgba(0,45,98,0.1)]">
            <CardHeader className="p-6">
              <CardTitle className="text-[#002D62]">
                Fuel Added by Mission Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={missionPie || []}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(e: any) => `${e.name} (${formatNum(e.value)}L)`}
                    >
                      {(missionPie || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${formatNum(v)} L`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  color,
  suffix,
}: {
  title: string;
  value?: number;
  color: string;
  suffix?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-[0_2px_6px_rgba(0,45,98,0.1)]">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-[#003366] text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-3xl font-bold" style={{ color }}>
          {formatNum(value)}
          {suffix || ''}
        </div>
      </CardContent>
    </Card>
  );
}

function formatNum(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return new Intl.NumberFormat().format(v);
}
