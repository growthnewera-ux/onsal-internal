"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  assignee: string;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

const MEMBERS = ["김다솔", "BM2", "콘텐츠", "퍼포먼스", "디자이너", "영업"];
const MEMBER_COLORS: Record<string, string> = {
  "김다솔": "bg-purple-100 text-purple-700",
  "BM2": "bg-blue-100 text-blue-700",
  "콘텐츠": "bg-green-100 text-green-700",
  "퍼포먼스": "bg-orange-100 text-orange-700",
  "디자이너": "bg-pink-100 text-pink-700",
  "영업": "bg-gray-100 text-gray-700",
};

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterMember, setFilterMember] = useState<string>("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ assignee: MEMBERS[0], title: "", dueDate: "" });

  useEffect(() => {
    const saved = localStorage.getItem("onsal_tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  const persist = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("onsal_tasks", JSON.stringify(updated));
  };

  const addTask = () => {
    if (!form.title.trim()) return;
    const t: Task = {
      id: Date.now().toString(),
      assignee: form.assignee,
      title: form.title.trim(),
      dueDate: form.dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    persist([t, ...tasks]);
    setForm({ assignee: MEMBERS[0], title: "", dueDate: "" });
    setShowAdd(false);
  };

  const toggleComplete = (id: string) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    persist(tasks.filter((t) => t.id !== id));
  };

  const filtered = filterMember === "전체" ? tasks : tasks.filter((t) => t.assignee === filterMember);
  const pending = filtered.filter((t) => !t.completed);
  const done = filtered.filter((t) => t.completed);

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  return (
    <div className="space-y-5">
      {/* 상단 필터 & 추가 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          {["전체", ...MEMBERS].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMember(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterMember === m
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          + 업무 추가
        </Button>
      </div>

      {/* 업무 추가 폼 */}
      {showAdd && (
        <Card className="border-dashed border-2 border-black">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">담당자</label>
                <select
                  className="border border-gray-200 rounded px-2 py-1.5 text-sm"
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                >
                  {MEMBERS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 mb-1 block">업무 내용</label>
                <Input
                  placeholder="업무 내용 입력"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">마감일</label>
                <Input
                  type="date"
                  className="w-36"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <Button onClick={addTask}>추가</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 진행 중 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            진행 중
            <Badge variant="secondary">{pending.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">진행 중인 업무가 없어요 🎉</p>
          )}
          {pending.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-white"
            >
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggleComplete(t.id)}
                className="w-4 h-4 cursor-pointer accent-black"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                {t.dueDate && (
                  <p className={`text-xs mt-0.5 ${isOverdue(t.dueDate) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {isOverdue(t.dueDate) ? "⚠ 마감 초과: " : "마감: "}
                    {new Date(t.dueDate).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEMBER_COLORS[t.assignee] || "bg-gray-100 text-gray-700"}`}>
                {t.assignee}
              </span>
              <button
                onClick={() => deleteTask(t.id)}
                className="text-gray-300 hover:text-red-400 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 완료 */}
      {done.length > 0 && (
        <Card className="opacity-70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gray-500">
              완료
              <Badge variant="secondary">{done.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {done.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggleComplete(t.id)}
                  className="w-4 h-4 cursor-pointer accent-black"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 line-through truncate">{t.title}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEMBER_COLORS[t.assignee] || "bg-gray-100 text-gray-700"}`}>
                  {t.assignee}
                </span>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-gray-300 hover:text-red-400 text-xs ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
