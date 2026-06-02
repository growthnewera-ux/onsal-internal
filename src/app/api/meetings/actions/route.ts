import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { actionItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const db = getDb();
  const { meetingId, content, assignee, dueDate } = await req.json();
  const inserted = await db.insert(actionItems).values({
    meetingId,
    content,
    assignee,
    dueDate: dueDate || null,
    completed: false,
  }).returning();
  return NextResponse.json(inserted[0]);
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, completed } = await req.json();
  const updated = await db
    .update(actionItems)
    .set({ completed })
    .where(eq(actionItems.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  await db.delete(actionItems).where(eq(actionItems.id, id));
  return NextResponse.json({ ok: true });
}
