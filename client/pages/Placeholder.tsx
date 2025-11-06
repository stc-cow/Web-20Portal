import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { useEffect, useState } from 'react';

const TITLES: Record<string, string> = {
  '/users': 'Users & authorization',
  '/users/admins': 'Admin Users',
  '/users/authorizations': 'Authorizations',
  '/missions': 'Missions',
  '/employees': 'Employees',
  '/employees/drivers': 'Drivers',
  '/employees/technicians': 'Technicians',
  '/sites': 'Sites',
  '/generators': 'Generators',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/settings/cities': 'Cities',
  '/settings/zones': 'Zones',
  '/settings/admin-log': 'Admin Log',
};

export default function Placeholder() {
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const title = TITLES[pathname] || pathname.replace('/', '');
  return (
    <PageLayout
      title={title || 'Placeholder'}
      description="This workspace is ready for implementation. Provide the requirements and we will craft the full experience."
      breadcrumbs={[{ label: 'Work-in-progress' }, { label: title || 'Placeholder' }]}
    >
      <div className="flex min-h-[50vh] items-center justify-center">
        <GlassCard className="max-w-lg border-white/10 bg-white/5 p-10 text-center text-slate-100">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-4 text-sm text-slate-200/70">
            This page is ready to be filled. Tell me what to add and I’ll build it.
          </p>
        </GlassCard>
      </div>
    </PageLayout>
  );
}
