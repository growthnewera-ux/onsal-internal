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

interface Budget { month: string; totalBudget: number; }
interface CategoryBudget { month: string; category: string; budget: number; }

// 카테고리 정의
const CATEGORIES = ["광고비", "제조비", "촬영비", "임상비", "툴/구독", "인건비", "기타"];

const CAT_CONFIG: Record<string, { color: string; barColor: string; hint: string }> = {
  "광고비":  { color: "#EF4444", barColor: "bg-red-500",    hint: "메타, 네이버, 유튜브 등 광고" },
  "제조비":  { color: "#8B5CF6", barColor: "bg-violet-500", hint: "제조사 · 용기 · 단상자 등" },
  "촬영비":  { color: "#EC4899", barColor: "bg-pink-500",   hint: "제품 촬영, 모델, 스튜디오" },
  "임상비":  { color: "#0EA5E9", barColor: "bg-sky-500",    hint: "임상 시험, 인증 관련" },
  "툴/구독": { color: "#3B82F6", barColor: "bg-blue-500",   hint: "클로드, 노션, 기타 SaaS" },
  "인건비":  { color: "#F59E0B", barColor: "bg-amber-500",  hint: "급여, 프리랜서 등" },
  "기타":    { color: "#6B7280", barColor: "bg-gray-400",   hint: "그 외 기타" },
};

const ALL_MONTHS = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06",
                    "2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];

const fmt = (n: number) =>
  n >= 100_000_000 ? `${(n / 100_000_000).toFixed(1)}억` :
  n >= 10_000 ? `${Math.round(n / 10_000)}만` :
  n.toLocaleString();

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
  const [editingTotalBudget, setEditingTotalBudget] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catInput, setCatInput] = useState("");
  const [form, setForm] = useState({
    category: CATEGORIES[0], description: "", amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetch("/api/expenses").then(r => r.json()).then(setExpenses);
    fetch("/api/budgets").then(r => r.json()).then((rows: Budget[]) => {
      const m: Record<string, number> = {};
      rows.forEach(r => { m[r.month] = r.totalBudget; });
      setBudgetMap(m);
    });
    fetch("/api/category-budgets").then(r => r.json()).then((rows: CategoryBudget[]) => {
      const m: Record<string, Record<string, number>> = {};
      rows.forEach(r => { if (!m[r.month]) m[r.month] = {}; m[r.month][r.category] = r.budget; });
      setCatBudgetMap(m);
    });
  }, []);

  const saveTotalBudget = async () => {
    const amount = Number(totalBudgetInput.replace(/,/g, "")) || 0;
    const res = await fetch("/api/budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: filterMonth, totalBudget: amount }),
    });
    const saved = await res.json();
    setBudgetMap(p => ({ ...p, [filterMonth]: saved.totalBudget }));
    setEditingTotalBudget(false);
  };

  const saveCatBudget = async (cat: string) => {
    const amount = Number(catInput.replace(/,/g, "")) || 0;
    await fetch("/api/category-budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: filterMonth, category: cat, budget: amount }),
    });
    setCatBudgetMap(p => ({ ...p, [filterMonth]: { ...(p[filterMonth] || {}), [cat]: amount } }));
    setEditingCat(null);
  };

  const addExpense = async () => {
    if (!form.description.trim() || !form.amount) return;
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount.replace(/,/g, "")) }),
    });
    setExpenses(p => [await res.json(), ...p]);
    setForm({ category: CATEGORIES[0], description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const deleteExpense = async (id: number) => {
    await fetch("/api/expenses", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExpenses(p => p.filter(e => e.id !== id));
  };

  const monthExp = expenses.filter(e => e.date.startsWith(filterMonth));
  const totalSpent = monthExp.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgetMap[filterMonth] || 0;
  const catBudgets = catBudgetMap[filterMonth] || {};
  const yearTotal = expenses.filter(e => e.date.startsWith("2026")).reduce((s, e) => s + e.amount, 0);

  const catStats = CATEGORIES.map(cat => {
    const spent = monthExp.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    const budget = catBudgets[cat] || 0;
    const rate = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const over = budget > 0 && spent > budget;
    return { cat, spent, budget, rate, over };
  });

  const filtered = (filterCat === "전체" ? monthExp : monthExp.filter(e => e.category === filterCat))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">

      {/* 상단: 연간합산 + 이번달 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 bg-gray-900 text-white rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">2026년 연간 합산 지출</p>
          <p className="text-2xl font-bold">{fmtFull(yearTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">{filterMonth.slice(5)}월 지출</p>
          <p className="text-xl font-bold">{fmt(totalSpent)}원</p>
          {totalBudget > 0 && (
            <p className={`text-xs mt-1 font-medium ${totalSpent > totalBudget ? "text-red-600" : "text-gray-500"}`}>
              예산 {fmt(totalBudget)}원 중 {((totalSpent / totalBudget) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* 월 탭 + 지출 추가 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {ALL_MONTHS.map(m => {
            const has = expenses.some(e => e.date.startsWith(m));
            return (
              <button key={m} onClick={() => setFilterMonth(m)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  filterMonth === m ? "bg-gray-900 text-white border-gray-900"
                  : has ? "bg-white border-gray-300 text-gray-700 hover:border-gray-500"
                  : m === currentMonth ? "bg-white border-gray-300 text-gray-500"
                  : "bg-white border-gray-100 text-gray-300 hover:border-gray-300"
                }`}>{m.slice(5)}월</button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>지출 추가</Button>
      </div>

      {/* 지출 추가 폼 */}
      {showAdd && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-gray-500 mb-1 block">내용</label>
                <Input placeholder="예: 메타 광고비, 용기 업체 A" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
                <Input className="w-36" placeholder="5,000,000" value={form.amount}
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

      {/* 카테고리별 예산 현황 - 가로 바 리스트 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filterMonth.slice(5)}월 카테고리별 현황</CardTitle>
            {editingTotalBudget ? (
              <div className="flex gap-1.5 items-center">
                <Input className="w-32 h-7 text-sm" placeholder="총 예산" value={totalBudgetInput}
                  onChange={e => setTotalBudgetInput(toComma(e.target.value))}
                  onKeyDown={e => e.key === "Enter" && saveTotalBudget()} autoFocus />
                <Button size="sm" className="h-7 text-xs" onClick={saveTotalBudget}>저장</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingTotalBudget(false)}>취소</Button>
              </div>
            ) : (
              <button onClick={() => { setEditingTotalBudget(true); setTotalBudgetInput(totalBudget ? String(totalBudget) : ""); }}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2.5 py-1 hover:border-gray-400">
                {totalBudget > 0 ? `총예산 ${fmt(totalBudget)}원` : "총예산 설정"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {catStats.map(({ cat, spent, budget, rate, over }) => {
              const cfg = CAT_CONFIG[cat];
              const isEditing = editingCat === cat;
              const hasActivity = spent > 0 || budget > 0;

              return (
                <div key={cat}
                  className={`grid items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-gray-50 transition-colors ${hasActivity ? "" : "opacity-40"}`}
                  style={{ gridTemplateColumns: "80px 1fr 120px 90px" }}>

                  {/* 카테고리 이름 */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    <span className="text-sm font-medium text-gray-700 truncate">{cat}</span>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="relative">
                    <div className="w-full h-6 bg-gray-100 rounded overflow-hidden">
                      {budget > 0 && (
                        <div className={`h-full ${cfg.barColor} opacity-20 transition-all`}
                          style={{ width: "100%" }} />
                      )}
                      {spent > 0 && (
                        <div
                          className={`h-full absolute top-0 left-0 ${cfg.barColor} transition-all`}
                          style={{ width: budget > 0 ? `${rate}%` : `${Math.min((spent / (totalSpent || 1)) * 80, 90)}%`, opacity: 0.85 }}
                        />
                      )}
                    </div>
                    {!hasActivity && (
                      <p className="absolute inset-0 flex items-center px-2 text-xs text-gray-400">예산/지출 없음</p>
                    )}
                  </div>

                  {/* 지출 금액 + 예산 */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{fmt(spent)}원</p>
                    {isEditing ? (
                      <div className="flex gap-1 mt-0.5 justify-end">
                        <Input className="w-20 h-5 text-xs" placeholder="예산" value={catInput}
                          onChange={e => setCatInput(toComma(e.target.value))}
                          onKeyDown={e => e.key === "Enter" && saveCatBudget(cat)} autoFocus />
                        <button onClick={() => saveCatBudget(cat)} className="text-xs text-blue-600">저장</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingCat(cat); setCatInput(budget ? String(budget) : ""); }}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-0.5 block w-full text-right">
                        {budget > 0 ? `/ ${fmt(budget)}원` : "예산 설정"}
                      </button>
                    )}
                  </div>

                  {/* 달성률 뱃지 */}
                  <div className="text-right">
                    {budget > 0 ? (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        over ? "bg-red-100 text-red-700" :
                        rate >= 80 ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {over ? `초과 ${fmt(spent - budget)}` : `${rate.toFixed(0)}%`}
                      </span>
                    ) : spent > 0 ? (
                      <span className="text-xs text-gray-400">예산없음</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 총합 바 */}
          {totalBudget > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "80px 1fr 120px 90px" }}>
                <span className="text-xs font-semibold text-gray-500">총합</span>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className={`h-full rounded transition-all ${
                    totalSpent > totalBudget ? "bg-red-500" : totalSpent / totalBudget > 0.8 ? "bg-amber-400" : "bg-emerald-500"
                  }`} style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
                </div>
                <p className="text-sm font-bold text-right text-gray-800">{fmt(totalSpent)}원</p>
                <p className="text-right text-xs text-gray-500">
                  {((totalSpent / totalBudget) * 100).toFixed(0)}% 사용
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1.5">
        {["전체", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
              filterCat === c ? "bg-gray-900 text-white border-gray-900"
              : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
            }`}>{c}</button>
        ))}
      </div>

      {/* 지출 목록 */}
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
                  <th className="py-3 w-6" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const cfg = CAT_CONFIG[e.category] || CAT_CONFIG["기타"];
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 group">
                      <td className="py-2.5 px-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                          <span className="text-xs text-gray-600">{e.category}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-700">{e.description}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmtFull(e.amount)}</td>
                      <td className="py-2.5 text-right text-gray-400 text-xs">
                        {new Date(e.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => deleteExpense(e.id)}
                          className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-3 px-1 text-xs text-gray-400 font-medium">합계</td>
                  <td className="py-3 text-right font-bold">{fmtFull(filtered.reduce((s, e) => s + e.amount, 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
