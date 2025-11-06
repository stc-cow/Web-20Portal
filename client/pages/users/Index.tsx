import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users2, UserPlus } from 'lucide-react';

export default function UsersIndexPage() {
  const { t } = useI18n();
  return (
    <PageLayout
      title="Identity & access hub"
      description="Manage admin access, authorization scopes and provisioning workflows."
      breadcrumbs={[{ label: 'Security' }, { label: t('usersAuth') }]}
      actions={
        <Button className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('inviteAdmin', { defaultValue: 'Invite admin' })}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Active administrators',
            value: '14',
            description: 'Full control over mission approvals.',
            icon: Users2,
          },
          {
            label: 'Scoped roles',
            value: '6',
            description: 'Granular permission sets in use.',
            icon: ShieldCheck,
          },
          {
            label: 'Pending invitations',
            value: '3',
            description: 'Awaiting activation or acceptance.',
            icon: UserPlus,
          }].map((metric) => (
            <GlassCard
              key={metric.label}
              className="flex items-start gap-4 border-white/10 bg-white/[0.07] p-5"
            >
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <metric.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-200/70">{metric.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Link to="/users/admins" className="group block">
          <GlassCard className="h-full border-white/10 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-7 transition hover:border-sky-400/40 hover:bg-sky-500/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100/80">
                  {t('adminUsers')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Platform administrators
                </h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-100">
                <Users2 className="h-6 w-6" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-200/70">
              Create and maintain privileged accounts with granular platform
              access.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/60">
              <span>{t('manage', { defaultValue: 'Manage' })}</span>
              <span className="transition group-hover:text-white">→</span>
            </div>
          </GlassCard>
        </Link>
        <Link to="/users/authorizations" className="group block">
          <GlassCard className="h-full border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-7 transition hover:border-emerald-400/40 hover:bg-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100/80">
                  {t('authorizations')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Authorization policies
                </h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100">
                <ShieldCheck className="h-6 w-6" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-200/70">
              Configure scope-based access to missions, generators and
              reporting suites.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/60">
              <span>{t('review', { defaultValue: 'Review' })}</span>
              <span className="transition group-hover:text-white">→</span>
            </div>
          </GlassCard>
        </Link>
      </div>
    </PageLayout>
  );
}
