import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useKpis,
  useRegionLitersTotal,
  useRegionLitersPie,
  useMissionCategoryPie,
} from '@/hooks/useDashboard';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  Compass,
  Fuel,
  Gauge,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';

const COLORS = ['#60A5FA', '#22D3EE', '#F97316', '#E2E8F0'];

export default function Index() {
  const { data: kpis } = useKpis();
  const { data: regionTotals } = useRegionLitersTotal();
  const { data: regionPie } = useRegionLitersPie();
  const { data: missionPie } = useMissionCategoryPie();

  const totalRegionalVolume = (regionPie || []).reduce(
    (sum, entry) => sum + Number(entry?.value || 0),
    0,
  );
  const leadingRegion = [...(regionPie || [])].sort(
    (a, b) => Number(b?.value || 0) - Number(a?.value || 0),
  )[0];
  const centralShare = percentageOf(
    regionTotals?.central || 0,
    totalRegionalVolume,
  );
  const eastShare = percentageOf(regionTotals?.east || 0, totalRegionalVolume);
  const trailingAverage = (kpis?.liters30d || 0) / 30;
  const todayDelta = percentageChange(kpis?.litersToday || 0, trailingAverage);

  const heroHighlights = [
    {
      label: 'Liters Added Today',
      value: `${formatNum(kpis?.litersToday)} L`,
      description: 'Live pumped volume captured across all zones.',
    },
    {
      label: '30 Day Rolling Total',
      value: `${formatNum(kpis?.liters30d)} L`,
      description: 'Aggregate delivery performance for the last month.',
    },
    {
      label: 'Top Performing Region',
      value: leadingRegion
        ? `${leadingRegion.name} • ${percentageOf(
            leadingRegion.value,
            totalRegionalVolume,
          )}`
        : 'Awaiting data',
      description: 'Share of total fuel delivered by leading region.',
    },
  ];

  const quickActions = [
    {
      label: 'Schedule mission',
      description: 'Assign fuel delivery teams and confirm dispatch windows.',
      to: '/missions',
      icon: CalendarClock,
      badge: 'Planning',
    },
    {
      label: 'Mission performance',
      description: 'Review completion status, SLA adherence and fuel variances.',
      to: '/reports',
      icon: BarChart3,
      badge: 'Reports',
    },
    {
      label: 'Driver readiness',
      description: 'Validate crew availability, certifications and assignments.',
      to: '/employees',
      icon: ShieldCheck,
      badge: 'Compliance',
    },
  ];

  const missionLeaders = [...(missionPie || [])]
    .sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))
    .slice(0, 3);

  return (
    <AppShell>
      <Header />
      <main className="relative min-h-screen bg-[#040b1d]">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-br from-[#0b1e3e] via-[#102c57] to-[#040b1d]" />
        <div className="relative z-[1] px-6 pb-12 pt-6">
          <section className="grid gap-6 xl:grid-cols-[1.8fr,1fr]">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#204975] text-slate-100 shadow-xl">
              <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
              <CardHeader className="space-y-4 pb-2 bg-[#1c365f]">
                <Badge className="w-fit bg-sky-400/20 text-xs font-medium uppercase tracking-[0.3em] text-sky-100">
                  ACES Fuel
                </Badge>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      Command Center Dashboard
                    </CardTitle>
                    <p className="mt-2 max-w-xl text-sm text-slate-200/80">
                      Stay ahead of fueling demand with a consolidated, real-time
                      view of volumes, crews and mission outcomes across your
                      network.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    Systems operational
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-3">
                  {heroHighlights.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border border-white/10 p-4 backdrop-blur ${
                        item.label === 'Liters Added Today'
                          ? 'bg-[#204975]'
                          : item.label === '30 Day Rolling Total'
                            ? 'bg-[#204873]'
                            : 'bg-[#204a75]'
                      }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-100/70">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-100/70">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card className="rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-lg backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-white">
                    Quick actions
                  </CardTitle>
                  <p className="text-xs text-slate-200/70">
                    Deploy missions, surface insights and confirm readiness.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="group flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                          <action.icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {action.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-200/70">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="rounded-full bg-white/10 text-[10px] font-semibold uppercase tracking-widest text-slate-100">
                          {action.badge}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-200/60 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/10 bg-[#1b395d] text-slate-100 shadow-lg">
                <CardHeader className="pb-3 bg-[#1b395d]">
                  <CardTitle className="text-lg font-semibold text-white">
                    Operations snapshot
                  </CardTitle>
                  <p className="text-xs text-slate-200/70">
                    A curated summary of today&apos;s key operational signals.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-200/80 bg-[#1b395d]">
                  <SnapshotItem
                    title="Active missions"
                    value={formatNum(kpis?.activeMissions)}
                    icon={Compass}
                    accent="bg-emerald-400/20 text-emerald-300"
                    description="Live assignments progressing toward completion."
                  />
                  <SnapshotItem
                    title="Available drivers"
                    value={formatNum(kpis?.activeDrivers)}
                    icon={Users}
                    accent="bg-sky-400/20 text-sky-200"
                    description="Crew members cleared for dispatch right now."
                  />
                  <SnapshotItem
                    title="Central region share"
                    value={centralShare}
                    icon={MapPin}
                    accent="bg-purple-400/20 text-purple-200"
                    description="Contribution to total liters delivered today."
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Key performance overview
                </h2>
                <p className="text-xs text-slate-200/70">
                  Monitor demand, throughput and crew readiness at a glance.
                </p>
              </div>
              <Button
                variant="ghost"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-widest text-slate-100 transition hover:bg-white/10 sm:flex"
              >
                <Gauge className="h-4 w-4" />
                Refresh metrics
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard
                title="Liters added today"
                value={formatNum(kpis?.litersToday)}
                icon={Fuel}
                accent="#60A5FA"
                description="Real-time fueling progress across all active missions."
                trendLabel="vs 30-day avg"
                trendValue={formatDelta(todayDelta)}
              />
              <MetricCard
                title="Rolling 30-day volume"
                value={`${formatNum(kpis?.liters30d)} L`}
                icon={BarChart3}
                accent="#C084FC"
                description="Total liters recorded in the last thirty days."
                trendLabel="Daily avg"
                trendValue={`${formatNum(Math.round(trailingAverage || 0))} L`}
              />
              <MetricCard
                title="Central region throughput"
                value={`${formatNum(regionTotals?.central)} L`}
                icon={MapPin}
                accent="#38BDF8"
                description="Volume dispatched through the Central corridor."
                trendLabel="Share"
                trendValue={centralShare}
              />
              <MetricCard
                title="East region throughput"
                value={`${formatNum(regionTotals?.east)} L`}
                icon={Compass}
                accent="#FBBF24"
                description="Volume dispatched through the Eastern corridor."
                trendLabel="Share"
                trendValue={eastShare}
              />
            </div>
          </section>

          <section className="mt-10 grid gap-6 xl:grid-cols-3">
            <InsightCard
              title="Fuel distribution by region"
              description="Visualize volume allocation across operational zones."
              className="xl:col-span-2"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionPie || []}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={130}
                      paddingAngle={2}
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.name} ${percentageOf(entry.percent || 0, 1, true)}`
                      }
                    >
                      {(regionPie || []).map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <Label
                        value="Total volume"
                        position="center"
                        fill="#E2E8F0"
                        className="text-sm"
                      />
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${formatNum(value)} L`}
                      contentStyle={{
                        background: '#0b1e3e',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#E2E8F0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(regionPie || []).map((entry, index) => (
                  <div
                    key={entry.name ?? index}
                    className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-4 text-xs text-slate-200/80"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {entry.name}
                    </span>
                    <span className="mt-2 text-lg font-semibold text-white">
                      {formatNum(entry.value)} L
                    </span>
                    <span className="mt-1 text-xs uppercase tracking-wide text-slate-200/60">
                      {percentageOf(entry.value, totalRegionalVolume)} of total
                    </span>
                  </div>
                ))}
              </div>
            </InsightCard>

            <InsightCard
              title="Mission fuel mix"
              description="Understand which mission categories draw the most supply."
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={missionPie || []}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={2}
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.name} ${percentageOf(entry.percent || 0, 1, true)}`
                      }
                    >
                      {(missionPie || []).map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <Label
                        value="Fuel demand"
                        position="center"
                        fill="#E2E8F0"
                        className="text-sm"
                      />
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${formatNum(value)} L`}
                      contentStyle={{
                        background: '#0b1e3e',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#E2E8F0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-3">
                {missionLeaders.map((mission) => (
                  <div
                    key={mission.name}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/40 p-4 text-sm text-slate-200/80"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {mission.name}
                      </p>
                      <p className="text-xs text-slate-200/60">
                        {percentageOf(mission.value, totalMissionVolume(missionPie))}{' '}
                        of demand
                      </p>
                    </div>
                    <span className="text-base font-semibold text-white">
                      {formatNum(mission.value)} L
                    </span>
                  </div>
                ))}
              </div>
            </InsightCard>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border border-white/10 bg-slate-900/30 text-slate-100 shadow-lg backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white">
                  Regional load outlook
                </CardTitle>
                <p className="text-xs text-slate-200/70">
                  Balance throughput with resource allocation in each zone.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-200/70">
                <RegionProgress
                  name="Central"
                  value={regionTotals?.central || 0}
                  share={centralShare}
                  accent="#38BDF8"
                />
                <RegionProgress
                  name="East"
                  value={regionTotals?.east || 0}
                  share={eastShare}
                  accent="#FBBF24"
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-slate-900/10 text-slate-100 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white">
                  Mission control log
                </CardTitle>
                <p className="text-xs text-slate-200/70">
                  Recent highlights curated for leadership visibility.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <TimelineItem
                  title="Fuel dispatch synchronized"
                  description="Central depots locked routes for overnight deliveries."
                  icon={Fuel}
                  accent="bg-emerald-400/20 text-emerald-300"
                  timestamp="08:20"
                />
                <TimelineItem
                  title="Mission briefings completed"
                  description="Crew leads acknowledged updated safety protocols."
                  icon={ShieldCheck}
                  accent="bg-sky-400/20 text-sky-200"
                  timestamp="09:45"
                />
                <TimelineItem
                  title="East corridor demand spike"
                  description="Proactive tanker reallocation initiated for afternoon window."
                  icon={Gauge}
                  accent="bg-amber-400/20 text-amber-200"
                  timestamp="11:10"
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

type MetricCardProps = {
  title: string;
  value?: string | number;
  icon: LucideIcon;
  accent: string;
  description: string;
  trendLabel?: string;
  trendValue?: string;
};

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
  description,
  trendLabel,
  trendValue,
}: MetricCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/30 text-slate-100 shadow-lg backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at top, ${accent}33, transparent 55%)` }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              {title}
            </CardTitle>
            <p className="mt-1 text-xs text-slate-200/70">{description}</p>
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            style={{ color: accent }}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold text-white">
          {typeof value === 'number' ? formatNum(value) : value ?? '--'}
        </div>
        {(trendLabel || trendValue) && (
          <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-200/70">
            {trendLabel && <span>{trendLabel}</span>}
            {trendValue && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                {trendValue}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type SnapshotItemProps = {
  title: string;
  value?: string;
  icon: LucideIcon;
  accent: string;
  description: string;
};

function SnapshotItem({
  title,
  value,
  icon: Icon,
  accent,
  description,
}: SnapshotItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-4">
      <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-200/60">{description}</p>
      </div>
      <span className="text-base font-semibold text-white">{value ?? '--'}</span>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

function InsightCard({ title, description, className, children }: InsightCardProps) {
  return (
    <Card
      className={`rounded-3xl border border-white/10 bg-slate-900/30 text-slate-100 shadow-xl backdrop-blur ${className ?? ''}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        <p className="text-xs text-slate-200/70">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type RegionProgressProps = {
  name: string;
  value: number;
  share: string;
  accent: string;
};

function RegionProgress({ name, value, share, accent }: RegionProgressProps) {
  const percent = Number(share.replace('%', '')) || 0;
  return (
    <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm text-white">
        <span className="font-semibold">{name}</span>
        <span className="font-semibold">{formatNum(value)} L</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: accent }}
        />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-200/70">
        {share} of today&apos;s throughput
      </p>
    </div>
  );
}

type TimelineItemProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  timestamp: string;
};

function TimelineItem({
  title,
  description,
  icon: Icon,
  accent,
  timestamp,
}: TimelineItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-4">
      <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-200/60">{description}</p>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">
        {timestamp}
      </span>
    </div>
  );
}

function formatNum(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return new Intl.NumberFormat().format(v);
}

function percentageOf(value: number, total: number, fromFraction = false) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) {
    return '0%';
  }
  const normalized = fromFraction ? value : value / total;
  const pct = Math.max(0, Math.min(1, normalized));
  return `${Math.round(pct * 100)}%`;
}

function percentageChange(current: number, baseline: number) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return 0;
  }
  return ((current - baseline) / baseline) * 100;
}

function formatDelta(delta: number) {
  if (!Number.isFinite(delta) || delta === 0) return 'Flat';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta)}%`;
}

function totalMissionVolume(values?: { value: number }[] | null) {
  if (!values) return 0;
  return values.reduce((sum, entry) => sum + Number(entry?.value || 0), 0);
}
