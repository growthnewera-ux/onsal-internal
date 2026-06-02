import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

const DEFAULT_MEMBERS = [
  { name: "김다솔", role: "BM", color: "purple", order: 0 },
  { name: "BM2", role: "BM", color: "blue", order: 1 },
  { name: "콘텐츠", role: "콘텐츠 마케터", color: "green", order: 2 },
  { name: "퍼포먼스", role: "퍼포먼스 마케터", color: "orange", order: 3 },
  { name: "디자이너", role: "디자이너", color: "pink", order: 4 },
  { name: "영업", role: "영업", color: "gray", order: 5 },
];

export async function GET() {
  const db = getDb();
  let rows = await db.select().from(members).orderBy(asc(members.order));
  if (rows.length === 0) {
    // 처음 실행시 기본 멤버 삽입
    rows = await db.insert(members).values(DEFAULT_MEMBERS).returning();
  }
  return NextResponse.json(rows);
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
