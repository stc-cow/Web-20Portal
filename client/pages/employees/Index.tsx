import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Users } from 'lucide-react';

export default function EmployeesIndexPage() {
  const { t } = useI18n();
  return (
    <PageLayout
      title="Workforce command center"
      description="Coordinate driver readiness, technician coverage and on-call response teams."
      breadcrumbs={[{ label: 'Operations' }, { label: t('employees') }]}
      actions={
        <Button className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30">
          {t('inviteTeam', { defaultValue: 'Invite team member' })}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Active drivers',
            value: '62',
            description: 'Covering central, east and north regions.',
            icon: Truck,
          },
          {
            label: 'Technician coverage',
            value: '94%',
            description: 'Critical sites staffed within SLA.',
            icon: ShieldCheck,
          },
          {
            label: 'On-call crews',
            value: '18',
            description: 'Ready to deploy within 30 minutes.',
            icon: Users,
          }].map((item) => (
            <GlassCard
              key={item.label}
              className="flex items-start gap-4 border-white/10 bg-white/[0.07] p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-xs text-slate-200/70">{item.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Link to="/employees/drivers" className="group block">
          <GlassCard className="h-full border-white/10 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-7 transition hover:border-sky-400/40 hover:bg-sky-500/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100/80">
                  {t('drivers')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Fleet drivers roster
                </h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-100">
                <Truck className="h-6 w-6" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-200/70">
              Review certifications, zone assignments and activation status
              for every field driver.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/60">
              <span>View roster</span>
              <span className="transition group-hover:text-white">→</span>
            </div>
          </GlassCard>
        </Link>
        <Link to="/employees/technicians" className="group block">
          <GlassCard className="h-full border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-7 transition hover:border-emerald-400/40 hover:bg-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100/80">
                  {t('technicians', { defaultValue: 'Technicians' })}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Maintenance coverage
                </h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100">
                <ShieldCheck className="h-6 w-6" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-200/70">
              Track technician duty rotations, equipment readiness and
              certification expirations.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/60">
              <span>Manage specialists</span>
              <span className="transition group-hover:text-white">→</span>
            </div>
          </GlassCard>
        </Link>
      </div>
    </PageLayout>
  );
}
