"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

const CATEGORIES = ["광고비", "툴/구독", "외주", "인건비", "운영비", "기타"];
const CATEGORY_COLORS: Record<string, string> = {
  "광고비": "bg-red-100 text-red-700",
  "툴/구독": "bg-blue-100 text-blue-700",
  "외주": "bg-purple-100 text-purple-700",
  "인건비": "bg-orange-100 text-orange-700",
  "운영비": "bg-gray-100 text-gray-700",
  "기타": "bg-green-100 text-green-700",
};

const fmtKRW = (n: number) =>
  n >= 100000000
    ? `${(n / 100000000).toFixed(2)}억`
    : `${n.toLocaleString()}원`;

export default function ExpensesTab() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterCat, setFilterCat] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const saved = localStorage.getItem("onsal_expenses");
    if (saved) setExpenses(JSON.parse(saved));
  }, []);

  const persist = (updated: Expense[]) => {
    setExpenses(updated);
    localStorage.setItem("onsal_expenses", JSON.stringify(updated));
  };

  const addExpense = () => {
    if (!form.description.trim() || !form.amount) return;
    const e: Expense = {
      id: Date.now().toString(),
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount.replace(/,/g, "")),
      date: form.date,
    };
    persist([e, ...expenses]);
    setForm({ category: CATEGORIES[0], description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const deleteExpense = (id: string) => {
    persist(expenses.filter((e) => e.id !== id));
  };

  const filtered = expenses.filter((e) => {
    const monthMatch = e.date.startsWith(filterMonth);
    const catMatch = filterCat === "전체" || e.category === filterCat;
    return monthMatch && catMatch;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  // 카테고리별 합계
  const catSummary = CATEGORIES.map((cat) => ({
    cat,
    total: filtered.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  // 월 목록 (데이터 있는 달)
  const availableMonths = [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse();
  if (!availableMonths.includes(currentMonth)) availableMonths.unshift(currentMonth);

  return (
    <div className="space-y-5">
      {/* 월 선택 & 추가 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          {availableMonths.slice(0, 6).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMonth(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterMonth === m
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {m.slice(5)}월
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>+ 비용 추가</Button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <Card className="border-dashed border-2 border-black">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select
                  className="border border-gray-200 rounded px-2 py-1.5 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500 mb-1 block">내용</label>
                <Input
                  placeholder="예: 메타 광고비, 클로드 구독"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
                <Input
                  className="w-32"
                  placeholder="예: 500000"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <Input
                  type="date"
                  className="w-36"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <Button onClick={addExpense}>추가</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 border-2 border-black">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-gray-500">{filterMonth.slice(5)}월 총 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{fmtKRW(totalAmount)}</p>
          </CardContent>
        </Card>
        {catSummary.map((c) => (
          <Card key={c.cat}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-gray-500">{c.cat}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{fmtKRW(c.total)}</p>
              <p className="text-xs text-gray-400">{totalAmount > 0 ? Math.round((c.total / totalAmount) * 100) : 0}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {["전체", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCat === c
                ? "bg-black text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 지출 목록 */}
      <Card>
        <CardContent className="pt-4">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              {filterMonth.slice(5)}월에 등록된 비용이 없어요
            </p>
          )}
          <div className="space-y-2">
            {filtered
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-white"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category] || "bg-gray-100 text-gray-700"}`}>
                    {e.category}
                  </span>
                  <p className="flex-1 text-sm font-medium text-gray-800">{e.description}</p>
                  <p className="text-sm font-bold text-red-600">{fmtKRW(e.amount)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </p>
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="text-gray-300 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
