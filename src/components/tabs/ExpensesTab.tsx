"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface Budget {
  month: string;
  totalBudget: number;
}

const CATEGORIES = ["광고비", "툴/구독", "외주", "인건비", "운영비", "기타"];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  "광고비":  { bg: "bg-red-50",    text: "text-red-700",    bar: "bg-red-400" },
  "툴/구독": { bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-400" },
  "외주":    { bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-400" },
  "인건비":  { bg: "bg-amber-50",  text: "text-amber-700",  bar: "bg-amber-400" },
  "운영비":  { bg: "bg-slate-50",  text: "text-slate-600",  bar: "bg-slate-400" },
  "기타":    { bg: "bg-emerald-50",text: "text-emerald-700",bar: "bg-emerald-400" },
};

const fmt = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toFixed(1)}억`
    : n >= 10_000
    ? `${(n / 10_000).toFixed(0)}만`
    : `${n.toLocaleString()}`;

const fmtFull = (n: number) => `${n.toLocaleString()}원`;

export default function ExpensesTab() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterCat, setFilterCat] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses);
    fetch("/api/budgets").then((r) => r.json()).then((rows: Budget[]) => {
      const map: Record<string, number> = {};
      rows.forEach((r) => { map[r.month] = r.totalBudget; });
      setBudgetMap(map);
    });
  }, []);

  const saveBudget = async () => {
    const amount = Number(budgetInput.replace(/,/g, "")) || 0;
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: filterMonth, totalBudget: amount }),
    });
    const saved = await res.json();
    setBudgetMap((prev) => ({ ...prev, [filterMonth]: saved.totalBudget }));
    setEditingBudget(false);
  };

  const addExpense = async () => {
    if (!form.description.trim() || !form.amount) return;
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category,
        description: form.description,
        amount: Number(form.amount.replace(/,/g, "")),
        date: form.date,
      }),
    });
    const e = await res.json();
    setExpenses((prev) => [e, ...prev]);
    setForm({ category: CATEGORIES[0], description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const deleteExpense = async (id: number) => {
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const monthExpenses = expenses.filter((e) => e.date.startsWith(filterMonth));
  const filtered = filterCat === "전체" ? monthExpenses : monthExpenses.filter((e) => e.category === filterCat);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgetMap[filterMonth] || 0;
  const usedRate = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;

  const catBreakdown = CATEGORIES.map((cat) => ({
    cat,
    total: monthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const availableMonths = [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse();
  if (!availableMonths.includes(currentMonth)) availableMonths.unshift(currentMonth);

  const budgetColor =
    usedRate >= 90 ? "bg-red-500" :
    usedRate >= 70 ? "bg-amber-400" :
    "bg-emerald-500";

  return (
    <div className="space-y-5">
      {/* 월 탭 + 지출 추가 버튼 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {availableMonths.slice(0, 6).map((m) => (
            <button key={m} onClick={() => setFilterMonth(m)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                filterMonth === m
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}>
              {m.slice(0, 4)}년 {m.slice(5)}월
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>지출 추가</Button>
      </div>

      {/* 지출 추가 폼 */}
      {showAdd && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white"
                  value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500 mb-1 block">내용</label>
                <Input placeholder="예: 메타 광고비, 클로드 구독" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
                <Input className="w-36" placeholder="500000" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <Input type="date" className="w-36" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <Button onClick={addExpense}>추가</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 예산 현황 메인 카드 */}
      <Card className="border-gray-200">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{filterMonth.slice(0, 4)}년 {filterMonth.slice(5)}월 예산 현황</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{fmt(totalSpent)}원</span>
                {totalBudget > 0 && (
                  <span className="text-sm text-gray-400">/ {fmt(totalBudget)}원 예산</span>
                )}
              </div>
            </div>
            <div className="text-right">
              {editingBudget ? (
                <div className="flex gap-2 items-center">
                  <Input className="w-32 h-8 text-sm" placeholder="예산 입력 (원)"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                    autoFocus />
                  <Button size="sm" className="h-8" onClick={saveBudget}>저장</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingBudget(false)}>취소</Button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingBudget(true); setBudgetInput(totalBudget ? String(totalBudget) : ""); }}
                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 hover:border-gray-400 transition-colors">
                  {totalBudget > 0 ? "예산 수정" : "예산 설정"}
                </button>
              )}
            </div>
          </div>

          {/* 예산 프로그레스바 */}
          {totalBudget > 0 && (
            <div className="space-y-2 mb-4">
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
                  style={{ width: `${usedRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={`font-semibold ${usedRate >= 90 ? "text-red-600" : usedRate >= 70 ? "text-amber-600" : "text-emerald-600"}`}>
                  {usedRate.toFixed(1)}% 사용
                </span>
                <span className={remaining >= 0 ? "text-gray-500" : "text-red-600 font-semibold"}>
                  {remaining >= 0 ? `잔여 ${fmt(remaining)}원` : `초과 ${fmt(Math.abs(remaining))}원`}
                </span>
              </div>
            </div>
          )}

          {/* 카테고리별 분포 */}
          {catBreakdown.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {catBreakdown.map((c) => {
                const style = CATEGORY_STYLES[c.cat] || CATEGORY_STYLES["기타"];
                const pct = totalSpent > 0 ? (c.total / totalSpent) * 100 : 0;
                return (
                  <div key={c.cat} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-14 shrink-0 ${style.text}`}>{c.cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{fmt(c.total)}원</span>
                    <span className="text-xs text-gray-300 w-8 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1.5">
        {["전체", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
              filterCat === c
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* 지출 내역 테이블 */}
      <Card>
        <CardContent className="pt-0 pb-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {filterMonth.slice(5)}월 {filterCat !== "전체" ? `${filterCat} ` : ""}지출 내역이 없습니다
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-400 text-xs">
                  <th className="text-left py-3 font-medium px-1">카테고리</th>
                  <th className="text-left py-3 font-medium">내용</th>
                  <th className="text-right py-3 font-medium">금액</th>
                  <th className="text-right py-3 font-medium">날짜</th>
                  <th className="py-3 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                  const style = CATEGORY_STYLES[e.category] || CATEGORY_STYLES["기타"];
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 group">
                      <td className="py-2.5 px-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-700">{e.description}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmtFull(e.amount)}</td>
                      <td className="py-2.5 text-right text-gray-400 text-xs">
                        {new Date(e.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => deleteExpense(e.id)}
                          className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-3 px-1 text-xs text-gray-400 font-medium">합계</td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    {fmtFull(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
