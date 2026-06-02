import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { categoryBudgets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(categoryBudgets);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { month, category, budget } = await req.json();
  const existing = await db.select().from(categoryBudgets)
    .where(and(eq(categoryBudgets.month, month), eq(categoryBudgets.category, category)));

  if (existing.length > 0) {
    const updated = await db.update(categoryBudgets)
      .set({ budget })
      .where(and(eq(categoryBudgets.month, month), eq(categoryBudgets.category, category)))
      .returning();
    return NextResponse.json(updated[0]);
  }
  const inserted = await db.insert(categoryBudgets).values({ month, category, budget }).returning();
  return NextResponse.json(inserted[0]);
}
