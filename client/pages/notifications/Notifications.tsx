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
      <GlassCard className="max-w-3xl border-white/10 bg-white/10 p-8">
        <div className="grid gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
              Drivers
            </p>
            <Select value={driver} onValueChange={setDriver}>
              <SelectTrigger className="mt-2 max-w-sm border-white/20 bg-white/10 text-white focus:ring-sky-400">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-[#0b1e3e] text-slate-100">
                {drivers.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
              Title
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fuel restock briefing"
              className="mt-2 h-11 max-w-md border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">
              Message
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share mission updates, schedule adjustments or escalation alerts."
              className="mt-2 h-36 border-white/20 bg-white/10 text-white placeholder:text-slate-200/60 focus-visible:ring-sky-400"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/70">
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
