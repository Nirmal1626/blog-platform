import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient | ReturnType<typeof createBrowserClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    return {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'mock-user-id', email: 'rkp16feb2006@gmail.com' } },
          error: null
        }),
        signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
        signOut: async () => {
           // Clear mock session
           return { error: null };
        },
        onAuthStateChange: (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _callback: (event: string, session: unknown) => void
        ) => {
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: (table: string) => ({
        select: () => ({
          eq: (key: string, val: string | number) => ({
            single: async () => {
              try {
                const res = await fetch(`/api/mock-db?table=${table}&filterKey=${key}&filterVal=${val}`);
                const { data } = await res.json();
                return { data: data[0], error: null };
              } catch (error) {
                console.warn('Mock API not available, returning null. This is expected during static export.');
                return { data: null, error: null };
              }
            }
          }),
          order: () => ({
            ascending: false
          })
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        insert: (_item: unknown) => ({
          error: null
        }),
        delete: () => ({
          eq: async () => ({ error: null })
        })
      })
    } as unknown as SupabaseClient;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
