import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper for Mock DB calls
async function mockFetch(table: string, method: string = 'GET', body?: any, filters?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let url = `${baseUrl}/api/mock-db?table=${table}`;
  if (filters) {
    Object.keys(filters).forEach(key => url += `&${key}=${filters[key]}`);
  }

  const res = await fetch(url, {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: method !== 'GET' ? JSON.stringify({ table, item: body, id: body?.id, method }) : undefined,
    cache: 'no-store'
  });
  return res.json();
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // USE MOCK DB if credentials are missing
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    return {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'mock-user-id', email: 'rkp16feb2006@gmail.com', user_metadata: { name: 'Rishabh' } } },
          error: null
        }),
        signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: (table: string) => ({
        select: (query: string, options: any) => ({
          eq: (key: string, val: any) => ({
            single: async () => {
              const { data } = await mockFetch(table, 'GET', null, { filterKey: key, filterVal: val });
              return { data: data[0], error: null };
            },
            order: () => ({
              range: async () => mockFetch(table, 'GET', null, { filterKey: key, filterVal: val })
            })
          }),
          ilike: (key: string, val: any) => ({
            order: () => ({
              range: async () => mockFetch(table, 'GET', null, { search: val.replace(/%/g, '') })
            })
          }),
          order: () => ({
            range: async () => mockFetch(table, 'GET')
          }),
          single: async () => {
            const { data } = await mockFetch(table, 'GET');
            return { data: data[0], error: null };
          }
        }),
        insert: (item: any) => ({
          select: () => ({
            single: async () => mockFetch(table, 'POST', item)
          })
        }),
        update: (item: any) => ({
          eq: async (key: string, val: any) => mockFetch(table, 'PUT', { id: val, ...item })
        }),
        delete: () => ({
          eq: async (key: string, val: any) => {
             const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
             await fetch(`${baseUrl}/api/mock-db?table=${table}&id=${val}`, { method: 'DELETE' });
             return { error: null };
          }
        })
      })
    } as any;
  }

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}
