import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { category, description, amount, date } = await req.json();
  const inserted = await db.insert(expenses).values({
    category,
    description,
    amount,
    date,
  }).returning();
  return NextResponse.json(inserted[0]);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  await db.delete(expenses).where(eq(expenses.id, id));
  return NextResponse.json({ ok: true });
}
