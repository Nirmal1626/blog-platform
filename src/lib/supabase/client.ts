import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
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
        onAuthStateChange: (callback: any) => {
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: (table: string) => ({
        select: () => ({
          eq: (key: string, val: any) => ({
            single: async () => {
              const res = await fetch(`/api/mock-db?table=${table}&filterKey=${key}&filterVal=${val}`);
              const { data } = await res.json();
              return { data: data[0], error: null };
            }
          }),
          order: () => ({
            ascending: false
          })
        }),
        insert: (item: any) => ({
          error: null
        }),
        delete: () => ({
          eq: async () => ({ error: null })
        })
      })
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
