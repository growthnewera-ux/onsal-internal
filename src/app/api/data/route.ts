import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS onsal_kv (
      key   VARCHAR(200) PRIMARY KEY,
      value JSONB        NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// GET /api/data          → 모든 데이터 반환
// GET /api/data?key=xxx  → 특정 키 값 반환
export async function GET(request: NextRequest) {
  await ensureTable();
  const key = request.nextUrl.searchParams.get('key');
  if (key) {
    const rows = await sql`SELECT value FROM onsal_kv WHERE key = ${key}`;
    return NextResponse.json(rows[0]?.value ?? null);
  }
  const rows = await sql`SELECT key, value FROM onsal_kv ORDER BY updated_at DESC`;
  return NextResponse.json(rows);
}

// POST /api/data  { key, value }  → upsert
export async function POST(request: NextRequest) {
  await ensureTable();
  const { key, value } = await request.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }
  await sql`
    INSERT INTO onsal_kv (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = ${JSON.stringify(value)}::jsonb,
          updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}

// DELETE /api/data?key=xxx
export async function DELETE(request: NextRequest) {
  await ensureTable();
  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  await sql`DELETE FROM onsal_kv WHERE key = ${key}`;
  return NextResponse.json({ ok: true });
}
