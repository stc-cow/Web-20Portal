import { createClient } from '@supabase/supabase-js';

const runtimeUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (typeof window !== 'undefined' && (window as any).__env?.VITE_SUPABASE_URL) ||
  '';
const runtimeAnon =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (typeof window !== 'undefined' &&
    (window as any).__env?.VITE_SUPABASE_ANON_KEY) ||
  '';

function failingResponse() {
  return Promise.resolve({
    data: null,
    error: new Error(
      'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    ),
  });
}

function mockFrom() {
  return {
    select: () => ({
      order: () => failingResponse(),
      maybeSingle: () => failingResponse(),
      single: () => failingResponse(),
      eq: () => ({
        maybeSingle: () => failingResponse(),
        single: () => failingResponse(),
      }),
    }),
    insert: () => failingResponse(),
    update: () => ({ eq: () => failingResponse() }),
    delete: () => ({ eq: () => failingResponse() }),
  } as any;
}

function createMockRealtime() {
  let subs: any[] = [];
  return {
    channel: (_name: string) => {
      const ch: any = {
        _name: _name,
        on: (_evt: string, _filter: any, _cb: any) => ch,
        subscribe: () => ({ id: _name }),
      };
      subs.push(ch);
      return ch;
    },
    removeChannel: (_ch: any) => {},
  } as any;
}

let supabase: any;
if (runtimeUrl && runtimeAnon) {
  supabase = createClient(runtimeUrl, runtimeAnon);
} else {
  // provide a minimal mock to avoid runtime constructor errors; methods return a rejection-like response
  const realtime = createMockRealtime();
  supabase = { from: () => mockFrom(), ...realtime } as any;
}

export { supabase };
