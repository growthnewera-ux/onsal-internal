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

interface CategoryBudget {
  month: string;
  category: string;
  budget: number;
}

const CATEGORIES = ["광고비", "툴/구독", "외주", "인건비", "운영비", "기타"];

const CAT_COLORS: Record<string, { bg: string; text: string; bar: string; light: string }> = {
  "광고비":  { bg: "bg-red-50",    text: "text-red-700",    bar: "bg-red-500",    light: "bg-red-100" },
  "툴/구독": { bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-500",   light: "bg-blue-100" },
  "외주":    { bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-500", light: "bg-violet-100" },
  "인건비":  { bg: "bg-amber-50",  text: "text-amber-700",  bar: "bg-amber-500",  light: "bg-amber-100" },
  "운영비":  { bg: "bg-slate-50",  text: "text-slate-600",  bar: "bg-slate-500",  light: "bg-slate-100" },
  "기타":    { bg: "bg-emerald-50",text: "text-emerald-700",bar: "bg-emerald-500",light: "bg-emerald-100" },
};

const fmt = (n: number) =>
  n >= 100_000_000 ? `${(n / 100_000_000).toFixed(1)}억` :
  n >= 10_000 ? `${(n / 10_000).toFixed(0)}만` :
  `${n.toLocaleString()}`;

const fmtFull = (n: number) => `${n.toLocaleString()}원`;

const toComma = (v: string) => {
  const num = v.replace(/[^0-9]/g, "");
  return num ? Number(num).toLocaleString() : "";
};

export default function ExpensesTab() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  const [catBudgetMap, setCatBudgetMap] = useState<Record<string, Record<string, number>>>({});
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterCat, setFilterCat] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingCatBudget, setEditingCatBudget] = useState<string | null>(null);
  const [catBudgetInput, setCatBudgetInput] = useState("");
  const [form, setForm] = useState({
    category: CATEGORIES[0], description: "", amount: "", date: new Date().toISOString().slice(0, 10),
  });

  const ALL_MONTHS = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06",
                      "2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];

  useEffect(() => {
    fetch("/api/expenses").then(r => r.json()).then(setExpenses);
    fetch("/api/budgets").then(r => r.json()).then((rows: Budget[]) => {
      const map: Record<string, number> = {};
      rows.forEach(r => { map[r.month] = r.totalBudget; });
      setBudgetMap(map);
    });
    fetch("/api/category-budgets").then(r => r.json()).then((rows: CategoryBudget[]) => {
      const map: Record<string, Record<string, number>> = {};
      rows.forEach(r => {
        if (!map[r.month]) map[r.month] = {};
        map[r.month][r.category] = r.budget;
      });
      setCatBudgetMap(map);
    });
  }, []);

  const saveTotalBudget = async () => {
    const amount = Number(budgetInput.replace(/,/g, "")) || 0;
    const res = await fetch("/api/budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: filterMonth, totalBudget: amount }),
    });
    const saved = await res.json();
    setBudgetMap(prev => ({ ...prev, [filterMonth]: saved.totalBudget }));
    setEditingBudget(false);
  };

  const saveCatBudget = async (category: string) => {
    const amount = Number(catBudgetInput.replace(/,/g, "")) || 0;
    await fetch("/api/category-budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: filterMonth, category, budget: amount }),
    });
    setCatBudgetMap(prev => ({
      ...prev,
      [filterMonth]: { ...(prev[filterMonth] || {}), [category]: amount },
    }));
    setEditingCatBudget(null);
  };

  const addExpense = async () => {
    if (!form.description.trim() || !form.amount) return;
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount.replace(/,/g, "")) }),
    });
    const e = await res.json();
    setExpenses(prev => [e, ...prev]);
    setForm({ category: CATEGORIES[0], description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const deleteExpense = async (id: number) => {
    await fetch("/api/expenses", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const monthExpenses = expenses.filter(e => e.date.startsWith(filterMonth));
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgetMap[filterMonth] || 0;
  const monthCatBudgets = catBudgetMap[filterMonth] || {};
  const totalCatBudget = CATEGORIES.reduce((s, c) => s + (monthCatBudgets[c] || 0), 0);
  const yearTotal = expenses.filter(e => e.date.startsWith("2026")).reduce((s, e) => s + e.amount, 0);

  const catStats = CATEGORIES.map(cat => {
    const spent = monthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    const budget = monthCatBudgets[cat] || 0;
    const rate = budget > 0 ? (spent / budget) * 100 : 0;
    return { cat, spent, budget, rate };
  });

  const filtered = (filterCat === "전체" ? monthExpenses : monthExpenses.filter(e => e.category === filterCat))
    .sort((a, b) => b.date.localeCompare(a.date));

  const getBarColor = (rate: number) =>
    rate >= 100 ? "bg-red-500" : rate >= 80 ? "bg-amber-400" : "bg-emerald-500";

  const getTextColor = (rate: number) =>
    rate >= 100 ? "text-red-600 font-bold" : rate >= 80 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-5">

      {/* 연간 합산 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 bg-gray-900 text-white rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">2026년 연간 합산 지출</p>
          <p className="text-2xl font-bold">{fmtFull(yearTotal)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">이번 달 지출</p>
          <p className="text-xl font-bold text-gray-800">{fmt(totalSpent)}원</p>
          {totalBudget > 0 && (
            <p className={`text-xs mt-1 ${getTextColor((totalSpent/totalBudget)*100)}`}>
              예산 대비 {((totalSpent/totalBudget)*100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* 월 탭 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {ALL_MONTHS.map(m => {
            const hasData = expenses.some(e => e.date.startsWith(m));
            return (
              <button key={m} onClick={() => setFilterMonth(m)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                  filterMonth === m ? "bg-gray-900 text-white border-gray-900" :
                  hasData ? "bg-white border-gray-300 text-gray-700 hover:border-gray-500" :
                  m === currentMonth ? "bg-white border-gray-300 text-gray-600" :
                  "bg-white border-gray-100 text-gray-300 hover:border-gray-300 hover:text-gray-500"
                }`}>
                {m.slice(5)}월
              </button>
            );
          })}
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
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500 mb-1 block">내용</label>
                <Input placeholder="예: 메타 광고비" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
                <Input className="w-36" placeholder="500,000" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: toComma(e.target.value) }))}
                  onKeyDown={e => e.key === "Enter" && addExpense()} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <Input type="date" className="w-36" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <Button onClick={addExpense}>추가</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 예산 현황 + 총예산 설정 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filterMonth.slice(5)}월 예산 현황</CardTitle>
            <div className="flex items-center gap-2">
              {totalCatBudget > 0 && totalBudget > 0 && (
                <span className="text-xs text-gray-400">
                  카테고리 배분 {fmtFull(totalCatBudget)} / 총 {fmtFull(totalBudget)}
                </span>
              )}
              {editingBudget ? (
                <div className="flex gap-1 items-center">
                  <Input className="w-32 h-7 text-sm" placeholder="총 예산" value={budgetInput}
                    onChange={e => setBudgetInput(toComma(e.target.value))}
                    onKeyDown={e => e.key === "Enter" && saveTotalBudget()} autoFocus />
                  <Button size="sm" className="h-7" onClick={saveTotalBudget}>저장</Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingBudget(false)}>취소</Button>
                </div>
              ) : (
                <button onClick={() => { setEditingBudget(true); setBudgetInput(totalBudget ? String(totalBudget) : ""); }}
                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 hover:border-gray-400">
                  {totalBudget > 0 ? `총예산: ${fmt(totalBudget)}원` : "총예산 설정"}
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {catStats.map(({ cat, spent, budget, rate }) => {
              const c = CAT_COLORS[cat];
              const isEditing = editingCatBudget === cat;
              return (
                <div key={cat} className={`rounded-xl p-3 border ${c.bg} ${spent > 0 || budget > 0 ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${c.text}`}>{cat}</span>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Input className="w-20 h-6 text-xs" placeholder="예산" value={catBudgetInput}
                          onChange={e => setCatBudgetInput(toComma(e.target.value))}
                          onKeyDown={e => e.key === "Enter" && saveCatBudget(cat)} autoFocus />
                        <button onClick={() => saveCatBudget(cat)} className="text-xs text-blue-600 font-medium">저장</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingCatBudget(cat); setCatBudgetInput(budget ? String(budget) : ""); }}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        {budget > 0 ? `${fmt(budget)}` : "예산설정"}
                      </button>
                    )}
                  </div>

                  <p className="text-lg font-bold text-gray-800">{fmt(spent)}원</p>

                  {budget > 0 ? (
                    <>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${getBarColor(rate)}`}
                          style={{ width: `${Math.min(rate, 100)}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className={`text-xs ${getTextColor(rate)}`}>
                          {rate >= 100 ? `초과 ${fmt(spent - budget)}원` : `${rate.toFixed(0)}% 사용`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {rate < 100 ? `잔여 ${fmt(budget - spent)}원` : ""}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">예산 미설정</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 총예산 대비 전체 프로그레스 */}
          {totalBudget > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">총예산 사용률</span>
                <span className={getTextColor((totalSpent/totalBudget)*100)}>
                  {fmtFull(totalSpent)} / {fmtFull(totalBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${getBarColor((totalSpent/totalBudget)*100)}`}
                  style={{ width: `${Math.min((totalSpent/totalBudget)*100, 100)}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1.5">
        {["전체", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
              filterCat === c ? "bg-gray-900 text-white border-gray-900"
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
                {filtered.map(e => {
                  const c = CAT_COLORS[e.category] || CAT_COLORS["기타"];
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 group">
                      <td className="py-2.5 px-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.light} ${c.text}`}>{e.category}</span>
                      </td>
                      <td className="py-2.5 text-gray-700">{e.description}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmtFull(e.amount)}</td>
                      <td className="py-2.5 text-right text-gray-400 text-xs">
                        {new Date(e.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => deleteExpense(e.id)}
                          className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-3 px-1 text-xs text-gray-400 font-medium">합계</td>
                  <td className="py-3 text-right font-bold text-gray-900">{fmtFull(filtered.reduce((s, e) => s + e.amount, 0))}</td>
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
