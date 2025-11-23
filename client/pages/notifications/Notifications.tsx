import { PageLayout, GlassCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { BellRing, MessageCircle, Send, Signal } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificationsPage() {
  const [driver, setDriver] = useState('All');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('drivers')
        .select('name')
        .order('name');
      setDrivers([
        'All',
        ...(data || []).map((d: any) => d.name).filter(Boolean),
      ]);
    })();
  }, []);

  const onSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Title and Message are required.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const sentBy =
        localStorage.getItem('auth.username') ||
        localStorage.getItem('remember.username') ||
        'Admin';
      const payload = {
        title: title.trim(),
        message: message.trim(),
        driver_name: driver === 'All' ? null : driver,
        sent_by: sentBy,
      } as any;
      const { error } = await supabase
        .from('driver_notifications')
        .insert(payload);
      if (error) throw error;
      toast({ title: 'Notification sent', description: `To: ${driver}` });
      setTitle('');
      setMessage('');
    } catch (e: any) {
      toast({
        title: 'Send failed',
        description: e?.message || 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Driver communications"
      description="Coordinate field operations with targeted broadcasts and mission-critical alerts."
      breadcrumbs={[{ label: 'Operations' }, { label: 'Notifications' }]}
      actions={
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? 'Sending…' : 'Send now'}
        </Button>
      }
      heroContent={
        <div className="grid gap-3 sm:grid-cols-3">
          {[{
            label: 'Broadcast reach',
            value: driver === 'All' ? `${drivers.length - 1}+` : '1',
            description: driver === 'All'
              ? 'All rostered drivers will receive this message.'
              : `Targeted message to ${driver}.`,
            icon: Signal,
          },
          {
            label: 'Template title',
            value: title ? 'Drafting' : 'Untitled',
            description: title ? 'Preview ready for quick reuse.' : 'Add a subject to save template.',
            icon: MessageCircle,
          },
          {
            label: 'Last campaign',
            value: '3h ago',
            description: 'Previous dispatch acknowledged across fleet.',
            icon: BellRing,
          }].map((metric) => (
            <GlassCard
              key={metric.label}
              className="flex items-start gap-4 border-slate-200 bg-white p-5"
            >
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <metric.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-700">{metric.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      }
    >
      <GlassCard className="max-w-3xl border-slate-200 bg-white p-8">
        <div className="grid gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              Drivers
            </p>
            <Select value={driver} onValueChange={setDriver}>
              <SelectTrigger className="mt-2 max-w-sm border-slate-300 bg-slate-50 text-slate-900 focus:ring-sky-500">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="border border-slate-300 bg-white text-slate-900">
                {drivers.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              Title
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fuel restock briefing"
              className="mt-2 h-11 max-w-md border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:ring-sky-500"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              Message
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share mission updates, schedule adjustments or escalation alerts."
              className="mt-2 h-36 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:ring-sky-500"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
            <span>
              Use short, action-oriented language to keep crews aligned.
            </span>
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-full bg-emerald-500 px-5 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Sending…' : 'Dispatch' }
            </Button>
          </div>
        </div>
      </GlassCard>
    </PageLayout>
  );
}
