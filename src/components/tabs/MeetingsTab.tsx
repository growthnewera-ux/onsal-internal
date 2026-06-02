"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  id: string;
  content: string;
  assignee: string;
  completed: boolean;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  actions: ActionItem[];
}

const MEMBERS = ["김다솔", "BM2", "콘텐츠", "퍼포먼스", "디자이너", "영업", "전체"];
const MEMBER_COLORS: Record<string, string> = {
  "김다솔": "bg-purple-100 text-purple-700",
  "BM2": "bg-blue-100 text-blue-700",
  "콘텐츠": "bg-green-100 text-green-700",
  "퍼포먼스": "bg-orange-100 text-orange-700",
  "디자이너": "bg-pink-100 text-pink-700",
  "영업": "bg-gray-100 text-gray-700",
  "전체": "bg-black text-white",
};

export default function MeetingsTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10) });
  const [actionForm, setActionForm] = useState<Record<string, { content: string; assignee: string }>>({});

  useEffect(() => {
    const saved = localStorage.getItem("onsal_meetings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setMeetings(parsed);
      if (parsed.length > 0) setExpandedId(parsed[0].id);
    }
  }, []);

  const persist = (updated: Meeting[]) => {
    setMeetings(updated);
    localStorage.setItem("onsal_meetings", JSON.stringify(updated));
  };

  const addMeeting = () => {
    if (!form.title.trim()) return;
    const m: Meeting = {
      id: Date.now().toString(),
      title: form.title.trim(),
      date: form.date,
      actions: [],
    };
    const updated = [m, ...meetings];
    persist(updated);
    setExpandedId(m.id);
    setForm({ title: "", date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const addAction = (meetingId: string) => {
    const f = actionForm[meetingId];
    if (!f?.content.trim()) return;
    const action: ActionItem = {
      id: Date.now().toString(),
      content: f.content.trim(),
      assignee: f.assignee || MEMBERS[0],
      completed: false,
    };
    const updated = meetings.map((m) =>
      m.id === meetingId ? { ...m, actions: [...m.actions, action] } : m
    );
    persist(updated);
    setActionForm((prev) => ({ ...prev, [meetingId]: { content: "", assignee: MEMBERS[0] } }));
  };

  const toggleAction = (meetingId: string, actionId: string) => {
    const updated = meetings.map((m) =>
      m.id === meetingId
        ? { ...m, actions: m.actions.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a)) }
        : m
    );
    persist(updated);
  };

  const deleteAction = (meetingId: string, actionId: string) => {
    const updated = meetings.map((m) =>
      m.id === meetingId ? { ...m, actions: m.actions.filter((a) => a.id !== actionId) } : m
    );
    persist(updated);
  };

  const deleteMeeting = (id: string) => {
    persist(meetings.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-500">
          회의에서 나온 액션아이템을 담당자와 함께 관리해요
        </h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>+ 회의 추가</Button>
      </div>

      {showAdd && (
        <Card className="border-dashed border-2 border-black">
          <CardContent className="pt-4">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-gray-500 mb-1 block">회의명</label>
                <Input
                  placeholder="예: 주간 팀 미팅, 신제품 기획 회의"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addMeeting()}
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
              <Button onClick={addMeeting}>추가</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {meetings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            아직 등록된 회의가 없어요. 회의 추가 버튼을 눌러보세요!
          </CardContent>
        </Card>
      )}

      {meetings.map((m) => {
        const pending = m.actions.filter((a) => !a.completed).length;
        const total = m.actions.length;
        const isExpanded = expandedId === m.id;
        const af = actionForm[m.id] || { content: "", assignee: MEMBERS[0] };

        return (
          <Card key={m.id} className={isExpanded ? "border-black border-2" : ""}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-base">{isExpanded ? "▼" : "▶"}</span>
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(m.date).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {total > 0 && (
                    <Badge variant={pending === 0 ? "secondary" : "default"} className={pending === 0 ? "bg-green-100 text-green-700" : ""}>
                      {pending === 0 ? "✓ 완료" : `${pending}개 남음`}
                    </Badge>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMeeting(m.id); }}
                    className="text-gray-300 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-2 pt-0">
                {/* 액션 추가 */}
                <div className="flex gap-2 items-center flex-wrap bg-gray-50 p-3 rounded-lg">
                  <select
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white"
                    value={af.assignee}
                    onChange={(e) =>
                      setActionForm((prev) => ({ ...prev, [m.id]: { ...af, assignee: e.target.value } }))
                    }
                  >
                    {MEMBERS.map((mem) => <option key={mem}>{mem}</option>)}
                  </select>
                  <Input
                    className="flex-1 min-w-[200px] h-8"
                    placeholder="액션아이템 입력 후 Enter"
                    value={af.content}
                    onChange={(e) =>
                      setActionForm((prev) => ({ ...prev, [m.id]: { ...af, content: e.target.value } }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addAction(m.id)}
                  />
                  <Button size="sm" onClick={() => addAction(m.id)}>추가</Button>
                </div>

                {/* 액션 목록 */}
                {m.actions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">액션아이템을 추가해보세요</p>
                )}
                {m.actions.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${a.completed ? "border-gray-100 opacity-60" : "border-gray-200 bg-white"}`}
                  >
                    <input
                      type="checkbox"
                      checked={a.completed}
                      onChange={() => toggleAction(m.id, a.id)}
                      className="w-4 h-4 cursor-pointer accent-black"
                    />
                    <p className={`flex-1 text-sm ${a.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {a.content}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEMBER_COLORS[a.assignee] || "bg-gray-100 text-gray-700"}`}>
                      {a.assignee}
                    </span>
                    <button
                      onClick={() => deleteAction(m.id, a.id)}
                      className="text-gray-300 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
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
