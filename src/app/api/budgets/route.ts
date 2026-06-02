import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { budgets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(budgets);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { month, totalBudget } = await req.json();
  const existing = await db.select().from(budgets).where(eq(budgets.month, month));
  if (existing.length > 0) {
    const updated = await db.update(budgets).set({ totalBudget }).where(eq(budgets.month, month)).returning();
    return NextResponse.json(updated[0]);
  }
  const inserted = await db.insert(budgets).values({ month, totalBudget }).returning();
  return NextResponse.json(inserted[0]);
}
