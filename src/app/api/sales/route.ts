import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sales } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(sales).orderBy(sales.month);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { month, target, actual } = await req.json();
  const existing = await db.select().from(sales).where(eq(sales.month, month));
  if (existing.length > 0) {
    const updated = await db
      .update(sales)
      .set({ target, actual })
      .where(eq(sales.month, month))
      .returning();
    return NextResponse.json(updated[0]);
  }
  const inserted = await db.insert(sales).values({ month, target, actual }).returning();
  return NextResponse.json(inserted[0]);
}
