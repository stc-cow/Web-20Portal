import { useEffect, useState } from 'react';
import { Builder } from '@builder.io/react';
import { supabase } from '@/lib/supabase';

export function SupabaseTasks({ driverId }: { driverId?: string }) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchTasks = async () => {
      // Prefer driver_tasks; fallback to tasks if present
      try {
        // Build base query
        let q: any = supabase
          .from('driver_tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (driverId && driverId.trim()) {
          // Support driver_id, driver_name, or driver_phone
          q = q.or(
            `driver_id.eq.${driverId},driver_name.eq.${driverId},driver_phone.eq.${driverId}`,
          );
        }
        const { data, error } = await q;
        if (!cancelled && !error) setTasks(Array.isArray(data) ? data : []);
        if (!error || cancelled) return;
      } catch {}

      try {
        let q2: any = supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (driverId && driverId.trim()) q2 = q2.eq('driver_id', driverId);
        const { data } = await q2;
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      } catch {}
    };

    fetchTasks();

    const hasRealtime = typeof (supabase as any).channel === 'function';
    let channel: any = null;
    if (hasRealtime) {
      try {
        channel = (supabase as any)
          .channel('public:driver_tasks')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'driver_tasks' },
            () => fetchTasks(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            () => fetchTasks(),
          )
          .subscribe();
      } catch {}
    }

    return () => {
      cancelled = true;
      try {
        if (channel && typeof (supabase as any).removeChannel === 'function')
          (supabase as any).removeChannel(channel);
      } catch {}
    };
  }, [driverId]);

  return (
    <div className="space-y-3">
      {tasks.map((task: any) => (
        <div
          key={task.id}
          className="rounded-xl border border-gray-300 bg-gray-100 p-3 shadow-sm"
        >
          <h3 className="font-semibold">
            {task.title || task.site_name || `Task #${task.id}`}
          </h3>
          <p>Status: {task.status || task.admin_status || '-'}</p>
          <p>Driver: {task.driver_id || task.driver_name || '-'}</p>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-sm text-muted-foreground">No tasks</div>
      )}
    </div>
  );
}

Builder.registerComponent(SupabaseTasks, {
  name: 'Supabase Tasks',
  inputs: [
    {
      name: 'driverId',
      type: 'string',
      helperText: 'Filter by driver id/name/phone',
    },
  ],
});
