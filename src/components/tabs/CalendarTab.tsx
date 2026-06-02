"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  daysLeft: number;
  isPast: boolean;
  type: "launch" | "deadline" | "other";
  description?: string;
}

interface CalData {
  total: number;
  upcoming: CalEvent[];
  recent: CalEvent[];
  today: CalEvent[];
}

const TYPE_CONFIG = {
  launch:   { label: "런칭",  bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500" },
  deadline: { label: "납기",  bg: "bg-red-100",     text: "text-red-700",    bar: "bg-red-500" },
  other:    { label: "일정",  bg: "bg-gray-100",    text: "text-gray-600",   bar: "bg-gray-400" },
};

function DDay({ days }: { days: number }) {
  if (days === 0) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">D-Day</span>;
  if (days > 0) return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${days <= 7 ? "text-red-600 bg-red-50" : days <= 14 ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-100"}`}>D-{days}</span>;
  return <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">D+{Math.abs(days)}</span>;
}

export default function CalendarTab() {
  const [data, setData] = useState<CalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "launch" | "deadline">("all");

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      캘린더 불러오는 중...
    </div>
  );

  if (!data) return <div className="text-center py-20 text-red-400">캘린더 로드 실패</div>;

  const filtered = data.upcoming.filter(e => filter === "all" || e.type === filter);

  // 이번 달 / 다음 달 그룹핑
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const groupedUpcoming: Record<string, CalEvent[]> = {};
  filtered.forEach(e => {
    const ym = e.start.slice(0, 7);
    const label = ym === thisMonth ? `${ym.slice(5)}월 (이번 달)` : ym === nextMonth ? `${ym.slice(5)}월 (다음 달)` : `${ym.slice(5)}월`;
    if (!groupedUpcoming[label]) groupedUpcoming[label] = [];
    groupedUpcoming[label].push(e);
  });

  const launches = data.upcoming.filter(e => e.type === "launch").length;
  const deadlines = data.upcoming.filter(e => e.type === "deadline").length;
  const urgent = data.upcoming.filter(e => e.daysLeft <= 7).length;

  return (
    <div className="space-y-5">
      {/* 요약 KPI */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-2 border-black">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">다가오는 일정</p>
            <p className="text-2xl font-bold">{data.upcoming.length}개</p>
            <p className="text-xs text-gray-400 mt-1">전체 {data.total}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">런칭 일정</p>
            <p className="text-2xl font-bold text-emerald-600">{launches}개</p>
            <p className="text-xs text-gray-400 mt-1">제품 출시</p>
          </CardContent>
        </Card>
        <Card className={urgent > 0 ? "border-red-200 border-2" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">7일 내 마감</p>
            <p className={`text-2xl font-bold ${urgent > 0 ? "text-red-600" : "text-gray-400"}`}>{urgent}개</p>
            <p className="text-xs text-gray-400 mt-1">{urgent > 0 ? "⚠ 주의 필요" : "여유 있음"}</p>
          </CardContent>
        </Card>
      </div>

      {/* 오늘 일정 */}
      {data.today.length > 0 && (
        <div className="bg-black text-white rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2 font-semibold">오늘 일정</p>
          {data.today.map(e => (
            <p key={e.id} className="text-sm font-medium">{e.title}</p>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-1.5">
        {([["all", "전체"], ["launch", "런칭"], ["deadline", "납기"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${filter === v ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            {l}
          </button>
        ))}
        <p className="ml-auto text-xs text-gray-400 self-center">구글 캘린더 자동 동기화 ✓</p>
      </div>

      {/* 월별 그룹 */}
      {Object.entries(groupedUpcoming).map(([month, events]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">{month}</p>
          <div className="space-y-2">
            {events.map(e => {
              const cfg = TYPE_CONFIG[e.type];
              return (
                <div key={e.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border bg-white hover:border-gray-300 transition-colors ${e.daysLeft <= 7 ? "border-red-100" : "border-gray-100"}`}>
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${cfg.bar}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(e.start + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  <DDay days={e.daysLeft} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-gray-400 text-sm">해당 일정이 없어요</CardContent></Card>
      )}
    </div>
  );
}
