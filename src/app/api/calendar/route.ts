import { NextResponse } from "next/server";

const ICAL_URL = "https://calendar.google.com/calendar/ical/1581e3a3aa9acf11b99f9f3111082e0dd507da05180c5e138d100c4fcab7c90c%40group.calendar.google.com/public/basic.ics";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  daysLeft: number;
  isPast: boolean;
  type: "launch" | "deadline" | "other";
}

function parseIcal(text: string): CalEvent[] {
  const events: CalEvent[] = [];
  const blocks = text.split("BEGIN:VEVENT");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : "";
    };

    const summary = get("SUMMARY");
    const dtstart = get("DTSTART");
    const uid = get("UID");
    const desc = get("DESCRIPTION");

    if (!summary || !dtstart) continue;

    // 날짜 파싱 (YYYYMMDD or YYYYMMDDTHHmmssZ)
    const dateStr = dtstart.replace(/T.*/, "");
    const y = parseInt(dateStr.slice(0, 4));
    const m = parseInt(dateStr.slice(4, 6)) - 1;
    const d = parseInt(dateStr.slice(6, 8));
    const date = new Date(y, m, d);

    const daysLeft = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 이벤트 타입 분류
    const titleLower = summary.toLowerCase();
    let type: CalEvent["type"] = "other";
    if (summary.includes("런칭") || summary.includes("출시")) type = "launch";
    else if (summary.includes("납기") || summary.includes("마감") || summary.includes("deadline")) type = "deadline";

    events.push({
      id: uid || `${summary}-${dateStr}`,
      title: summary,
      start: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      end: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      description: desc || undefined,
      daysLeft,
      isPast: daysLeft < 0,
      type,
    });
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}

export async function GET() {
  try {
    const res = await fetch(ICAL_URL, { next: { revalidate: 3600 } }); // 1시간 캐시
    if (!res.ok) throw new Error("캘린더 fetch 실패");
    const text = await res.text();
    const events = parseIcal(text);

    const today = new Date().toISOString().slice(0, 10);

    return NextResponse.json({
      total: events.length,
      upcoming: events.filter(e => !e.isPast).slice(0, 20),
      recent: events.filter(e => e.isPast).slice(-5).reverse(),
      today: events.filter(e => e.start === today),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
