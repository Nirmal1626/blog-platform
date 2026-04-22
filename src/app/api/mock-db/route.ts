import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory fallback storage for local dev (no persistence)
const memoryDB: { [key: string]: any[] } = {};

async function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key || url.includes('your_supabase')) {
    return null;
  }
  
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) return NextResponse.json({ error: 'Table required' }, { status: 400 });

  const supabase = await getSupabaseClient();
  
  try {
    if (supabase) {
      // Use actual Supabase for posts and comments
      let query = supabase.from(table).select('*');
      
      const filterKey = searchParams.get('filterKey');
      const filterVal = searchParams.get('filterVal');
      if (filterKey && filterVal) {
        query = query.eq(filterKey, filterVal);
      }

      const search = searchParams.get('search');
      if (search) {
        query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data: data || [], count: data?.length || 0 });
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }

  // Fallback to memory
  let data = memoryDB[table] || [];
  const filterKey = searchParams.get('filterKey');
  const filterVal = searchParams.get('filterVal');
  if (filterKey && filterVal) {
    data = data.filter((item: any) => item[filterKey] === filterVal);
  }

  const search = searchParams.get('search');
  if (search) {
    data = data.filter((item: any) => 
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.body?.toLowerCase().includes(search.toLowerCase())
    );
  }

  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: NextRequest) {
  const { table, item } = await request.json();
  if (!table || !item) return NextResponse.json({ error: 'Table and item required' }, { status: 400 });

  const supabase = await getSupabaseClient();
  
  try {
    if (supabase) {
      const newItem = {
        ...item,
        created_at: item.created_at || new Date().toISOString()
      };
      
      const { data, error } = await supabase.from(table).insert([newItem]).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }

  // Fallback to memory
  const newItem = {
    ...item,
    id: item.id || Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };

  memoryDB[table] = [...(memoryDB[table] || []), newItem];
  return NextResponse.json({ data: newItem });
}

export async function PUT(request: NextRequest) {
  const { table, id, item } = await request.json();
  
  const supabase = await getSupabaseClient();
  
  try {
    if (supabase) {
      const updateData = {
        ...item,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }

  // Fallback to memory
  if (memoryDB[table]) {
    memoryDB[table] = memoryDB[table].map((i: any) => 
      i.id === id ? { ...i, ...item, updated_at: new Date().toISOString() } : i
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) return NextResponse.json({ error: 'Table and id required' }, { status: 400 });

  const supabase = await getSupabaseClient();
  
  try {
    if (supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }

  // Fallback to memory
  if (memoryDB[table]) {
    memoryDB[table] = memoryDB[table].filter((i: any) => i.id !== id);
  }

  return NextResponse.json({ success: true });
}
