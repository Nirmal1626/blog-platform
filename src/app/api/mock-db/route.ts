import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

async function readDB() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeDB(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) return NextResponse.json({ error: 'Table required' }, { status: 400 });

  const db = await readDB();
  let data = db[table] || [];

  // Simple filtering mock
  const filterKey = searchParams.get('filterKey');
  const filterVal = searchParams.get('filterVal');
  if (filterKey && filterVal) {
    data = data.filter((item: any) => item[filterKey] === filterVal);
  }

  // Simple search mock
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

  const db = await readDB();
  const newItem = {
    ...item,
    id: item.id || Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };

  db[table] = [...(db[table] || []), newItem];
  await writeDB(db);

  return NextResponse.json({ data: newItem });
}

export async function PUT(request: NextRequest) {
  const { table, id, item } = await request.json();
  const db = await readDB();
  
  if (db[table]) {
    db[table] = db[table].map((i: any) => i.id === id ? { ...i, ...item, updated_at: new Date().toISOString() } : i);
    await writeDB(db);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  const db = await readDB();
  if (db[table]) {
    db[table] = db[table].filter((i: any) => i.id !== id);
    await writeDB(db);
  }

  return NextResponse.json({ success: true });
}
