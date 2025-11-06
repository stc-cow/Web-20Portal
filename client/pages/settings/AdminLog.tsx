import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/i18n';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Log = { id: number; username: string; event: string; created_at: string };

export default function AdminLogPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_log')
        .select('id, username, event, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!cancelled && !error && data) setRows(data as any);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageLayout
      title={t('settingsAdminLog')}
      description="Review privileged activity, approvals and security touchpoints captured across the platform."
      breadcrumbs={[{ label: t('settings') }, { label: t('settingsAdminLog') }]}
    >
      <GlassCard className="border-white/10 bg-white/5 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full text-slate-100">
            <TableHeader>
              <TableRow className="bg-white/[0.08] text-xs uppercase tracking-[0.2em] text-slate-100">
                <TableHead className="border-none text-slate-100">
                  {t('username')}
                </TableHead>
                <TableHead className="border-none text-slate-100">
                  {t('time')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-sm text-slate-200/70"
                  >
                    {t('loading')}
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-sm text-slate-200/70"
                  >
                    {t('noDataYet')}
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-white/5 bg-white/[0.02] text-sm text-slate-100"
                  >
                    <TableCell className="font-semibold text-white">
                      {r.username}
                    </TableCell>
                    <TableCell className="text-slate-200/80">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </PageLayout>
  );
}
