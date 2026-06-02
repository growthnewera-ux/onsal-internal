import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, actionItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const meetingRows = await db.select().from(meetings).orderBy(desc(meetings.date));
  const actionRows = await db.select().from(actionItems).orderBy(actionItems.createdAt);

  const result = meetingRows.map((m) => ({
    ...m,
    actions: actionRows.filter((a) => a.meetingId === m.id),
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { title, date } = await req.json();
  const inserted = await db.insert(meetings).values({ title, date }).returning();
  return NextResponse.json({ ...inserted[0], actions: [] });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, summary } = await req.json();
  const updated = await db.update(meetings).set({ summary }).where(eq(meetings.id, id)).returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  await db.delete(actionItems).where(eq(actionItems.meetingId, id));
  await db.delete(meetings).where(eq(meetings.id, id));
  return NextResponse.json({ ok: true });
}
