import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(members).orderBy(asc(members.order));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, role, color } = await req.json();
  const all = await db.select().from(members);
  const maxOrder = all.length > 0 ? Math.max(...all.map((m) => m.order)) + 1 : 0;
  const COLORS = ["purple", "blue", "green", "orange", "pink", "gray"];
  const usedColors = all.map((m) => m.color);
  const nextColor = color || COLORS.find((c) => !usedColors.includes(c)) || "gray";
  const inserted = await db.insert(members).values({
    name, role: role || "", color: nextColor, order: maxOrder,
  }).returning();
  return NextResponse.json(inserted[0]);
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, name, role } = await req.json();
  const updated = await db
    .update(members)
    .set({ name, role })
    .where(eq(members.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  await db.delete(members).where(eq(members.id, id));
  return NextResponse.json({ ok: true });
}
