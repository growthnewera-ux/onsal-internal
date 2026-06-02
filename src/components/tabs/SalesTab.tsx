"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface MonthData {
  month: string; // "2026-06"
  target: number;
  actual: number;
}

const MONTHS = [
  "2026-01","2026-02","2026-03","2026-04",
  "2026-05","2026-06","2026-07","2026-08",
  "2026-09","2026-10","2026-11","2026-12",
];

const fmtKRW = (n: number) =>
  n >= 100000000
    ? `${(n / 100000000).toFixed(2)}억`
    : n >= 10000
    ? `${(n / 10000).toFixed(0)}만`
    : n.toLocaleString();

export default function SalesTab() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [data, setData] = useState<MonthData[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ target: "", actual: "" });

  useEffect(() => {
    const saved = localStorage.getItem("onsal_sales");
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      const initial = MONTHS.map((m) => ({ month: m, target: 0, actual: 0 }));
      setData(initial);
    }
  }, []);

  const save = (updated: MonthData[]) => {
    setData(updated);
    localStorage.setItem("onsal_sales", JSON.stringify(updated));
  };

  const startEdit = (m: MonthData) => {
    setEditing(m.month);
    setForm({
      target: m.target ? String(m.target) : "",
      actual: m.actual ? String(m.actual) : "",
    });
  };

  const submitEdit = () => {
    const updated = data.map((d) =>
      d.month === editing
        ? { ...d, target: Number(form.target) || 0, actual: Number(form.actual) || 0 }
        : d
    );
    save(updated);
    setEditing(null);
  };

  const current = data.find((d) => d.month === currentMonth);
  const totalTarget = data.reduce((s, d) => s + d.target, 0);
  const totalActual = data.reduce((s, d) => s + d.actual, 0);

  const getRate = (actual: number, target: number) =>
    target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;

  const getColor = (rate: number) =>
    rate >= 100 ? "text-green-600" : rate >= 70 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="space-y-6">
      {/* 상단 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">이번 달 목표</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {current ? fmtKRW(current.target) : "-"}
            </p>
            <p className="text-xs text-gray-400 mt-1">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">이번 달 실적</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${current ? getColor(getRate(current.actual, current.target)) : ""}`}>
              {current ? fmtKRW(current.actual) : "-"}
            </p>
            {current && current.target > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">달성률</span>
                  <span className="font-semibold">
                    {Math.round((current.actual / current.target) * 100)}%
                  </span>
                </div>
                <Progress value={getRate(current.actual, current.target)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">연간 누적 달성</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fmtKRW(totalActual)}</p>
            <p className="text-xs text-gray-400 mt-1">
              목표: {fmtKRW(totalTarget)} ({totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 매출 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 font-medium">월</th>
                  <th className="text-right py-2 font-medium">목표</th>
                  <th className="text-right py-2 font-medium">실적</th>
                  <th className="text-right py-2 font-medium">달성률</th>
                  <th className="text-right py-2 font-medium">달성 현황</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => {
                  const rate = getRate(d.actual, d.target);
                  const isCurrent = d.month === currentMonth;
                  return (
                    <tr
                      key={d.month}
                      className={`border-b last:border-0 ${isCurrent ? "bg-gray-50" : ""}`}
                    >
                      <td className="py-2">
                        <span className={`font-medium ${isCurrent ? "text-black" : "text-gray-600"}`}>
                          {d.month.slice(5)}월 {isCurrent && <span className="text-xs bg-black text-white px-1 rounded ml-1">이번달</span>}
                        </span>
                      </td>
                      <td className="text-right py-2 text-gray-700">
                        {d.target ? fmtKRW(d.target) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="text-right py-2">
                        {d.actual ? (
                          <span className={getColor(rate)}>{fmtKRW(d.actual)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="text-right py-2">
                        {d.target > 0 ? (
                          <span className={`font-semibold ${getColor(rate)}`}>{rate}%</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 w-32">
                        {d.target > 0 && (
                          <Progress value={rate} className="h-1.5" />
                        )}
                      </td>
                      <td className="text-right py-2">
                        {editing === d.month ? (
                          <div className="flex gap-1 items-center justify-end">
                            <Input
                              className="w-24 h-7 text-xs"
                              placeholder="목표"
                              value={form.target}
                              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                            />
                            <Input
                              className="w-24 h-7 text-xs"
                              placeholder="실적"
                              value={form.actual}
                              onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))}
                            />
                            <Button size="sm" className="h-7 text-xs px-2" onClick={submitEdit}>저장</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditing(null)}>취소</Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-gray-400 hover:text-black"
                            onClick={() => startEdit(d)}
                          >
                            입력
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">💡 단위: 원 (예: 100000000 = 1억)</p>
        </CardContent>
      </Card>
    </div>
  );
}
