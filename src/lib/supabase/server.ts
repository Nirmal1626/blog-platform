import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import dbData from '../../../db.json';

interface MockFetchOptions {
  [key: string]: string | number;
}

// Helper for Mock DB calls
async function mockFetch(
  table: string,
  method: string = 'GET',
  body?: unknown,
  filters?: MockFetchOptions
) {
  // If we are in build phase or local dev without a running server, use db.json fallback
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production';
  
  if (isBuild || method === 'GET') {
    const data = (dbData as Record<string, any[]>)[table] || [];
    let filteredData = [...data];

    if (filters) {
      if (filters.filterKey && filters.filterVal) {
        filteredData = filteredData.filter(item => item[filters.filterKey] === filters.filterVal);
      }
      if (filters.search) {
        const search = String(filters.search).toLowerCase();
        filteredData = filteredData.filter(item => 
          (item.title?.toLowerCase().includes(search)) || 
          (item.body?.toLowerCase().includes(search))
        );
      }
    }

    return { data: filteredData, count: filteredData.length };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let url = `${baseUrl}/api/mock-db?table=${table}`;
  if (filters) {
    Object.keys(filters).forEach(key => url += `&${key}=${filters[key]}`);
  }

  try {
    const res = await fetch(url, {
      method: method === 'GET' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'GET' ? JSON.stringify({ 
        table, 
        item: body, 
        id: (body as Record<string, unknown> | undefined)?.id, 
        method 
      }) : undefined,
      cache: 'no-store'
    });
    return res.json();
  } catch (error) {
    console.error('Mock fetch failed, using local data:', error);
    return { data: (dbData as Record<string, any[]>)[table] || [], count: 0 };
  }
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        select: (_query: string, _options?: Record<string, unknown>) => ({
          eq: (key: string, val: string | number) => ({
            single: async () => {
              const { data } = await mockFetch(table, 'GET', null, { filterKey: key, filterVal: val });
              return { data: data[0], error: null };
            },
            order: () => ({
              range: async () => mockFetch(table, 'GET', null, { filterKey: key, filterVal: val })
            })
          }),
          ilike: (key: string, val: string) => ({
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
        insert: (item: unknown) => ({
          select: () => ({
            single: async () => mockFetch(table, 'POST', item)
          })
        }),
        update: (item: unknown) => ({
          eq: async (key: string, val: string | number) => mockFetch(table, 'PUT', { id: val, ...(item as Record<string, unknown>) })
        }),
        delete: () => ({
          eq: async (key: string, val: string | number) => {
             const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
             await fetch(`${baseUrl}/api/mock-db?table=${table}&id=${val}`, { method: 'DELETE' });
             return { error: null };
          }
        })
      })
    } as unknown as SupabaseClient;
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
