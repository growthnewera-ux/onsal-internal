import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const inserted = await db.insert(tasks).values({
    assignee: body.assignee,
    title: body.title,
    dueDate: body.dueDate || null,
    completed: false,
  }).returning();
  return NextResponse.json(inserted[0]);
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, completed } = await req.json();
  const updated = await db
    .update(tasks)
    .set({ completed })
    .where(eq(tasks.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ ok: true });
}
