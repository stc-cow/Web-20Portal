import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  SlidersHorizontal,
  Bell,
  Palette,
} from 'lucide-react';

export default function SettingsIndexPage() {
  const { t } = useI18n();
  return (
    <PageLayout
      title="Configuration center"
      description="Tune operational preferences, automation rules and brand surfaces."
      breadcrumbs={[{ label: t('settings') }]}
      actions={
        <Button className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {t('applyChanges', { defaultValue: 'Apply changes' })}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Automation rules',
            value: '12',
            description: 'Trigger mission updates and alert routing.',
            icon: SlidersHorizontal,
          },
          {
            label: 'Notification templates',
            value: '28',
            description: 'SMS, email and in-app experiences.',
            icon: BellCog,
          },
          {
            label: 'Brand themes',
            value: '3',
            description: 'Custom palettes applied across deployments.',
            icon: Palette,
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link to="/settings/general" className="group block">
          <GlassCard className="h-full border-white/10 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-7 transition hover:border-sky-400/40 hover:bg-sky-500/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100/80">
                  {t('settingsGeneral')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Platform defaults
                </h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-100">
                <SettingsIcon className="h-6 w-6" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-200/70">
              Update billing entities, branding and locale defaults that power
              every workspace.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/60">
              <span>{t('configure', { defaultValue: 'Configure' })}</span>
              <span className="transition group-hover:text-white">→</span>
            </div>
          </GlassCard>
        </Link>
      </div>
    </PageLayout>
  );
}
