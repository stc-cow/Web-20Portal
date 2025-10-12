import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function num(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function useKpis() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const [t1, t30, counts] = await Promise.all([
        supabase.from('v_liters_today').select('*').maybeSingle(),
        supabase.from('v_liters_30d').select('*').maybeSingle(),
        supabase.from('v_counts').select('*').maybeSingle(),
      ]);
      return {
        litersToday: num((t1.data as any)?.total_liters ?? 0),
        liters30d: num((t30.data as any)?.total_liters ?? 0),
        activeMissions: num((counts.data as any)?.active_missions ?? 0),
        activeDrivers: num((counts.data as any)?.active_drivers ?? 0),
      };
    },
  });
}

export function useStatusPie() {
  return useQuery({
    queryKey: ['statusPie'],
    queryFn: async () => {
      const { data } = await supabase.from('v_task_status').select('*');
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r: any) => ({
        name: r.status ?? 'Unknown',
        value: num(r.count),
      }));
    },
  });
}

export function useZonePie() {
  return useQuery({
    queryKey: ['zonePie'],
    queryFn: async () => {
      const { data } = await supabase.from('v_task_zones').select('*');
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r: any) => ({
        name: r.zone ?? 'Unknown',
        value: num(r.count),
      }));
    },
  });
}

export function useFuelTrend() {
  return useQuery({
    queryKey: ['fuelTrend'],
    queryFn: async () => {
      const { data } = await supabase
        .from('v_liters_trend')
        .select('*')
        .order('day');
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r: any) => ({ day: r.day, liters: num(r.liters) }));
    },
  });
}

export function useRegionLitersTotal() {
  return useQuery({
    queryKey: ['regionLitersTotal'],
    queryFn: async () => {
      const { data } = await supabase
        .from('v_liters_by_zone_total')
        .select('zone, liters');
      const rows = Array.isArray(data) ? data : [];
      let central = 0,
        east = 0;
      for (const r of rows) {
        const z = String((r as any).zone || '');
        if (z === 'Central') central += num((r as any).liters);
        if (z === 'East') east += num((r as any).liters);
      }
      return { central, east };
    },
  });
}
