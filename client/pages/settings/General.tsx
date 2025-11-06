import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';

type SettingsForm = {
  fuel_unit_price: number;
  vat_rate: number;
  supplier_name: string;
  supplier_address: string;
  invoice_prefix: string;
  invoice_sequence: number;
  fcm_server_key: string;
  fcm_sender_id: string;
};

export default function GeneralSettingsPage() {
  const { t } = useI18n();
  const role =
    typeof window !== 'undefined' ? localStorage.getItem('auth.role') : null;
  const isAdmin = role === 'superadmin';

  const [form, setForm] = useState<SettingsForm>({
    fuel_unit_price: 0.63,
    vat_rate: 0.15,
    supplier_name: '',
    supplier_address: '',
    invoice_prefix: 'INV-SEC-',
    invoice_sequence: 1,
    fcm_server_key: '',
    fcm_sender_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) {
        setForm((f) => ({
          fuel_unit_price: Number(data.fuel_unit_price ?? f.fuel_unit_price),
          vat_rate: Number(data.vat_rate ?? f.vat_rate),
          supplier_name: data.supplier_name ?? f.supplier_name,
          supplier_address: data.supplier_address ?? f.supplier_address,
          invoice_prefix: data.invoice_prefix ?? f.invoice_prefix,
          invoice_sequence: Number(data.invoice_sequence ?? f.invoice_sequence),
          fcm_server_key: data.fcm_server_key ?? f.fcm_server_key,
          fcm_sender_id: data.fcm_sender_id ?? f.fcm_sender_id,
        }));
      }
    })();
  }, []);

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    const { error } = await supabase.from('settings').upsert(
      [
        {
          id: 1,
          fuel_unit_price: form.fuel_unit_price,
          vat_rate: form.vat_rate,
          supplier_name: form.supplier_name,
          supplier_address: form.supplier_address,
          invoice_prefix: form.invoice_prefix,
          invoice_sequence: form.invoice_sequence,
          fcm_server_key: form.fcm_server_key,
          fcm_sender_id: form.fcm_sender_id,
        },
      ],
      { onConflict: 'id' },
    );
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'Saved', description: 'General settings updated.' });
  };

  const vatPercent = Math.round((form.vat_rate ?? 0) * 100);

  return (
    <PageLayout
      title="Platform configuration"
      description="Control billing defaults, fuel economics and notification infrastructure from a single command center."
      breadcrumbs={[{ label: t('settings') }, { label: t('settingsGeneral') }]}
      actions={
        <Button
          className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
          onClick={save}
          disabled={!isAdmin || saving}
        >
          {saving ? t('saving', { defaultValue: 'Saving…' }) : t('applyChanges', { defaultValue: 'Apply changes' })}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Fuel unit price',
            value: `${form.fuel_unit_price.toFixed(2)} SAR`,
            description: 'Rate applied across invoice calculations.',
          },
          {
            label: 'VAT rate',
            value: `${vatPercent}%`,
            description: 'Tax applied to supplier invoices.',
          },
          {
            label: 'Invoice prefix',
            value: form.invoice_prefix || '—',
            description: 'Current numbering scheme for exports.',
          }].map((metric) => (
            <GlassCard
              key={metric.label}
              className="border-white/10 bg-white/[0.07] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-200/70">{metric.description}</p>
            </GlassCard>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {!isAdmin && (
          <GlassCard className="border-white/10 bg-amber-500/10 p-5 text-sm text-amber-100">
            Only administrators can edit settings. Values are read-only.
          </GlassCard>
        )}

        <GlassCard className="border-white/10 bg-white/5 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Fuel unit price
              </div>
              <Input
                type="number"
                step="0.01"
                value={form.fuel_unit_price}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fuel_unit_price: Number(e.target.value),
                  }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                VAT rate
              </div>
              <Input
                type="number"
                step="0.01"
                value={form.vat_rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Supplier name
              </div>
              <Input
                value={form.supplier_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier_name: e.target.value }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Supplier address
              </div>
              <Input
                value={form.supplier_address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier_address: e.target.value }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Invoice prefix
              </div>
              <Input
                value={form.invoice_prefix}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoice_prefix: e.target.value }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                Invoice sequence
              </div>
              <Input
                type="number"
                value={form.invoice_sequence}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    invoice_sequence: Number(e.target.value),
                  }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                FCM server key
              </div>
              <Input
                value={form.fcm_server_key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fcm_server_key: e.target.value }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/60">
                FCM sender ID
              </div>
              <Input
                value={form.fcm_sender_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fcm_sender_id: e.target.value }))
                }
                disabled={!isAdmin}
                className="mt-2 border-white/20 bg-white/10 text-white focus-visible:ring-sky-400"
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </PageLayout>
  );
}
