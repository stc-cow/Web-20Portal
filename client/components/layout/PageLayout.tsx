import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export const glassCardClass =
  'relative overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-md';

export const softBorderCardClass =
  'rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm';

type Breadcrumb = {
  label: string;
  href?: string;
};

type PageLayoutProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  heroContent?: ReactNode;
  children: ReactNode;
};

export function PageLayout({
  title,
  description,
  breadcrumbs,
  actions,
  heroContent,
  children,
}: PageLayoutProps) {
  return (
    <AppShell>
      <Header />
      <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-br from-sky-50 via-blue-50 to-slate-50" />
        <div className="relative z-[1] px-6 pb-12 pt-6">
          <div
            className={cn(
              glassCardClass,
              'mb-8 overflow-hidden border-slate-200 bg-white p-6 sm:p-8',
            )}
          >
            <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-200/20 blur-3xl" />
            <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                        {crumb.href ? (
                          <Link
                            to={crumb.href}
                            className="transition hover:text-slate-900"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span>{crumb.label}</span>
                        )}
                        {index < breadcrumbs.length - 1 && (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    ))}
                  </nav>
                )}
                <div className="max-w-2xl space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-sm text-slate-700">{description}</p>
                  )}
                </div>
              </div>
              {actions && (
                <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
                  {actions}
                </div>
              )}
            </div>
            {heroContent && (
              <div className="relative z-[1] mt-6 border-t border-slate-200 pt-6">
                {heroContent}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </AppShell>
  );
}

export function PageSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('space-y-6', className)}>{children}</section>
  );
}

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        glassCardClass,
        'border-slate-200 bg-white p-6 sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SoftCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(softBorderCardClass, 'p-5', className)}>{children}</div>
  );
}
