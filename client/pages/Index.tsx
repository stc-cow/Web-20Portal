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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

const COLORS = ['#E21E26', '#004AAD', '#A5B4FC', '#C2C8CF'];

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
        <div className="mb-4 flex items-center justify-center" />

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Liters Added Today"
            value={kpis?.litersToday}
            color="#E30613"
          />
          <MetricCard
            title="Liters Added 30 Days"
            value={kpis?.liters30d}
            color="#003366"
          />
          <MetricCard
            title="Central"
            value={regionTotals?.central}
            color="#0070C0"
          />
          <MetricCard title="East" value={regionTotals?.east} color="#E30613" />
        </div>

        {/* Donut charts */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card className="rounded-[12px] bg-[#F7F8FC] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-0">
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
                      innerRadius={70}
                      outerRadius={120}
                      labelLine={false} label={(e: any) => `${e.name} ${Math.round((e.percent || 0) * 100)}%`}
                    >
                      {(regionPie || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <Label value="Fuel Distribution" position="center" fill="#0B1E3E" />
                    </Pie>
                    <Tooltip formatter={(v: any) => `${formatNum(v)} L`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[12px] bg-[#F7F8FC] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-0">
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
                      innerRadius={70}
                      outerRadius={120}
                      labelLine={false} label={(e: any) => `${e.name} ${Math.round((e.percent || 0) * 100)}%`}
                    >
                      {(missionPie || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <Label value="Diesel %" position="center" fill="#0B1E3E" />
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
    <Card className="rounded-[12px] bg-[#F7F8FC] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-0">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-[#003366] text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div
          className="text-3xl font-bold flex flex-col items-center justify-center"
          style={{ color }}
        >
          {formatNum(value)}
          {suffix ? '' : ''}
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
