"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMembers, COLOR_MAP } from "@/hooks/useMembers";

interface ActionItem {
  id: number;
  meetingId: number;
  content: string;
  assignee: string;
  dueDate: string | null;
  completed: boolean;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  actions: ActionItem[];
}

interface AIAction {
  assignee: string;
  content: string;
  dueDate: string | null;
}

export default function MeetingsTab() {
  const { members } = useMembers();
  const memberNames = ["전체", ...members.map((m) => m.name)];
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [actionForm, setActionForm] = useState<Record<number, { content: string; assignee: string; dueDate: string }>>({});

  // AI 분석 상태
  const [analyzeTarget, setAnalyzeTarget] = useState<number | null>(null); // 분석 대상 회의 ID
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ actions: AIAction[]; summary: string } | null>(null);
  const [selectedActions, setSelectedActions] = useState<boolean[]>([]);

  useEffect(() => {
    fetch("/api/meetings").then((r) => r.json()).then((data: Meeting[]) => {
      setMeetings(data);
      if (data.length > 0) setExpandedId(data[0].id);
    });
  }, []);

  const addMeeting = async () => {
    if (!form.title.trim()) return;
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, date: form.date }),
    });
    const m = await res.json();
    setMeetings((prev) => [m, ...prev]);
    setExpandedId(m.id);
    // 회의록이 있으면 AI 분석 바로 시작
    if (form.notes.trim()) {
      setNotes(form.notes);
      setAnalyzeTarget(m.id);
    }
    setForm({ title: "", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowAdd(false);
  };

  const deleteMeeting = async (id: number) => {
    await fetch("/api/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const analyzeNotes = async (meetingId: number) => {
    if (!notes.trim()) return;
    setAnalyzing(true);
    setAiResult(null);
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      const res = await fetch("/api/meetings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, members, meetingDate: meeting?.date }),
      });
      const data = await res.json();
      if (data.actions) {
        setAiResult(data);
        setSelectedActions(data.actions.map(() => true));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAiActions = async (meetingId: number) => {
    if (!aiResult) return;
    const toSave = aiResult.actions.filter((_, i) => selectedActions[i]);
    for (const a of toSave) {
      const res = await fetch("/api/meetings/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, content: a.content, assignee: a.assignee, dueDate: a.dueDate }),
      });
      const action = await res.json();
      setMeetings(prev => prev.map(m =>
        m.id === meetingId ? { ...m, actions: [...m.actions, action] } : m
      ));
    }
    setAiResult(null);
    setNotes("");
    setAnalyzeTarget(null);
  };

  const addAction = async (meetingId: number) => {
    const f = actionForm[meetingId];
    if (!f?.content.trim()) return;
    const res = await fetch("/api/meetings/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, content: f.content, assignee: f.assignee || memberNames[1] || "전체", dueDate: f.dueDate || null }),
    });
    const action = await res.json();
    setMeetings((prev) => prev.map((m) => m.id === meetingId ? { ...m, actions: [...m.actions, action] } : m));
    setActionForm((prev) => ({ ...prev, [meetingId]: { content: "", assignee: memberNames[1] || "전체", dueDate: "" } }));
  };

  const toggleAction = async (meetingId: number, actionId: number, completed: boolean) => {
    await fetch("/api/meetings/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: actionId, completed: !completed }),
    });
    setMeetings((prev) => prev.map((m) =>
      m.id === meetingId ? { ...m, actions: m.actions.map((a) => a.id === actionId ? { ...a, completed: !completed } : a) } : m
    ));
  };

  const deleteAction = async (meetingId: number, actionId: number) => {
    await fetch("/api/meetings/actions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: actionId }),
    });
    setMeetings((prev) => prev.map((m) =>
      m.id === meetingId ? { ...m, actions: m.actions.filter((a) => a.id !== actionId) } : m
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">회의록을 붙여넣으면 AI가 액션아이템을 자동으로 추출해요</p>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>+ 회의 추가</Button>
      </div>

      {showAdd && (
        <Card className="border-2 border-black">
          <CardContent className="pt-4 space-y-3">
            {/* 회의명 + 날짜 */}
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-gray-500 mb-1 block">회의명</label>
                <Input placeholder="예: 온살&루메 출시 회의" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <Input type="date" className="w-36" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            {/* 회의록 입력 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                회의록 / 카톡 내용 붙여넣기 <span className="text-gray-300">(선택 — AI가 자동으로 액션아이템 추출)</span>
              </label>
              <textarea
                className="w-full h-40 text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-300"
                placeholder={"회의 내용, 카톡 대화, 메모 등 자유롭게 붙여넣으세요.\n\nAI가 담당자별 할 일을 자동으로 정리해드려요."}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={addMeeting}>
                {form.notes.trim() ? "회의 추가 + AI 분석 시작" : "회의 추가"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {meetings.length === 0 && (
        <Card><CardContent className="py-12 text-center text-gray-400 text-sm">아직 등록된 회의가 없어요. 회의 추가 버튼을 눌러보세요!</CardContent></Card>
      )}

      {meetings.map((m) => {
        const pending = m.actions.filter((a) => !a.completed).length;
        const total = m.actions.length;
        const isExpanded = expandedId === m.id;
        const af = actionForm[m.id] || { content: "", assignee: memberNames[1] || "전체", dueDate: "" };

        return (
          <Card key={m.id} className={isExpanded ? "border-black border-2" : ""}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-base">{isExpanded ? "▼" : "▶"}</span>
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString("ko-KR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {total > 0 && (
                    <Badge variant={pending === 0 ? "secondary" : "default"} className={pending === 0 ? "bg-green-100 text-green-700" : ""}>
                      {pending === 0 ? "✓ 완료" : `${pending}개 남음`}
                    </Badge>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteMeeting(m.id); }} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-3 pt-0">

                {/* AI 회의록 분석 영역 */}
                {analyzeTarget === m.id ? (
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">✦ AI 회의록 분석</p>
                      <button onClick={() => { setAnalyzeTarget(null); setNotes(""); setAiResult(null); }}
                        className="text-gray-400 hover:text-gray-600 text-xs">✕ 닫기</button>
                    </div>

                    {!aiResult ? (
                      <>
                        <textarea
                          className="w-full h-36 text-sm border border-blue-200 rounded-lg p-3 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                          placeholder={`회의록, 카톡 내용, 메모 등 자유롭게 붙여넣으세요.\n\n예시:\n"예지님 6월 말까지 용기 발주 완료, 현지님 인스타 광고 다음주 집행, 동희님 쿠팡 입점 미팅 준비..."`}
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                        />
                        <Button
                          className="w-full"
                          onClick={() => analyzeNotes(m.id)}
                          disabled={analyzing || !notes.trim()}>
                          {analyzing ? "AI 분석 중..." : "✦ AI로 액션아이템 추출"}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {aiResult.summary && (
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold mb-1">회의 요약</p>
                            <p className="text-sm text-gray-700">{aiResult.summary}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">추출된 액션아이템 (저장할 항목 선택)</p>
                          {aiResult.actions.map((a, i) => (
                            <div key={i}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedActions[i] ? "bg-white border-blue-200" : "bg-gray-50 border-gray-100 opacity-50"}`}
                              onClick={() => setSelectedActions(prev => prev.map((v, j) => j === i ? !v : v))}>
                              <input type="checkbox" checked={selectedActions[i]} onChange={() => {}}
                                className="mt-0.5 accent-blue-600 w-4 h-4 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{a.content}</p>
                                {a.dueDate && (
                                  <p className="text-xs text-gray-400 mt-0.5">마감: {new Date(a.dueDate).toLocaleDateString("ko-KR")}</p>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${COLOR_MAP[members.find(mem => mem.name === a.assignee)?.color || "gray"]}`}>
                                {a.assignee}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => saveAiActions(m.id)}
                            disabled={!selectedActions.some(Boolean)}>
                            선택 항목 저장 ({selectedActions.filter(Boolean).length}개)
                          </Button>
                          <Button variant="ghost" onClick={() => { setAiResult(null); setNotes(""); }}>
                            다시 입력
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => { setAnalyzeTarget(m.id); setAiResult(null); setNotes(""); }}
                    className="w-full py-2 rounded-lg border border-dashed border-blue-200 text-sm text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium">
                    ✦ 회의록 붙여넣고 AI 분석
                  </button>
                )}

                {/* 수동 액션아이템 추가 */}
                <div className="flex gap-2 items-center flex-wrap bg-gray-50 p-3 rounded-lg">
                  <select className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white"
                    value={af.assignee}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, [m.id]: { ...af, assignee: e.target.value } }))}>
                    {memberNames.map((mem) => <option key={mem}>{mem}</option>)}
                  </select>
                  <Input className="flex-1 min-w-[200px] h-8" placeholder="액션아이템 입력 후 Enter"
                    value={af.content}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, [m.id]: { ...af, content: e.target.value } }))}
                    onKeyDown={(e) => e.key === "Enter" && addAction(m.id)} />
                  <Input type="date" className="w-32 h-8 text-xs"
                    value={af.dueDate}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, [m.id]: { ...af, dueDate: e.target.value } }))} />
                  <Button size="sm" onClick={() => addAction(m.id)}>추가</Button>
                </div>

                {m.actions.length === 0 && <p className="text-sm text-gray-400 text-center py-2">액션아이템을 추가해보세요</p>}
                {m.actions.map((a) => (
                  <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${a.completed ? "border-gray-100 opacity-60" : "border-gray-200 bg-white"}`}>
                    <input type="checkbox" checked={a.completed} onChange={() => toggleAction(m.id, a.id, a.completed)} className="w-4 h-4 cursor-pointer accent-black" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${a.completed ? "line-through text-gray-400" : "text-gray-700"}`}>{a.content}</p>
                      {a.dueDate && (
                        <p className={`text-xs mt-0.5 ${!a.completed && new Date(a.dueDate) < new Date(new Date().toDateString()) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          마감: {new Date(a.dueDate).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLOR_MAP[members.find((m) => m.name === a.assignee)?.color || (a.assignee === "전체" ? "black" : "gray")]}`}>{a.assignee}</span>
                    <button onClick={() => deleteAction(m.id, a.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
