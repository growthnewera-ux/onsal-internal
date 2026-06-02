"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Member, COLOR_MAP, useMembers } from "@/hooks/useMembers";

interface Props {
  onClose: () => void;
}

export default function MemberSettings({ onClose }: Props) {
  const { members, updateMember } = useMembers();
  const [editing, setEditing] = useState<Record<number, { name: string; role: string }>>({});

  const startEdit = (m: Member) => {
    setEditing((prev) => ({ ...prev, [m.id]: { name: m.name, role: m.role } }));
  };

  const save = async (id: number) => {
    const e = editing[id];
    if (!e?.name.trim()) return;
    await updateMember(id, e.name.trim(), e.role.trim());
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">👥 팀원 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">✕</button>
        </div>

        <div className="space-y-3">
          {members.map((m) => {
            const isEditing = !!editing[m.id];
            const e = editing[m.id] || { name: m.name, role: m.role };
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${COLOR_MAP[m.color] || "bg-gray-100 text-gray-700"}`}>
                  {(isEditing ? e.name : m.name).slice(0, 2)}
                </span>
                {isEditing ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="이름"
                      value={e.name}
                      onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...e, name: ev.target.value } }))}
                      onKeyDown={(ev) => ev.key === "Enter" && save(m.id)}
                    />
                    <Input
                      className="h-8 text-sm w-28"
                      placeholder="역할"
                      value={e.role}
                      onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...e, role: ev.target.value } }))}
                      onKeyDown={(ev) => ev.key === "Enter" && save(m.id)}
                    />
                    <Button size="sm" className="h-8 px-3" onClick={() => save(m.id)}>저장</Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.role || "역할 미설정"}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400 hover:text-black" onClick={() => startEdit(m)}>
                      수정
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">이름 수정 후 Enter 또는 저장 버튼을 눌러주세요</p>
      </div>
    </div>
  );
}
