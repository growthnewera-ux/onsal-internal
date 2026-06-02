"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Member, COLOR_MAP, useMembers } from "@/hooks/useMembers";

interface Props {
  onClose: () => void;
}

export default function MemberSettings({ onClose }: Props) {
  const { members, addMember, updateMember, deleteMember } = useMembers();
  const [editing, setEditing] = useState<Record<number, { name: string; role: string }>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", role: "" });

  const startEdit = (m: Member) => {
    setEditing((prev) => ({ ...prev, [m.id]: { name: m.name, role: m.role } }));
  };

  const save = async (id: number) => {
    const e = editing[id];
    if (!e?.name.trim()) return;
    await updateMember(id, e.name.trim(), e.role.trim());
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await addMember(addForm.name.trim(), addForm.role.trim());
    setAddForm({ name: "", role: "" });
    setShowAdd(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">팀원 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl leading-none">✕</button>
        </div>

        <div className="space-y-2 mb-4">
          {members.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">등록된 팀원이 없습니다</p>
          )}
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
                    <Input className="h-8 text-sm" placeholder="이름"
                      value={e.name}
                      onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...e, name: ev.target.value } }))}
                      onKeyDown={(ev) => ev.key === "Enter" && save(m.id)}
                      autoFocus />
                    <Input className="h-8 text-sm w-24" placeholder="역할"
                      value={e.role}
                      onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...e, role: ev.target.value } }))}
                      onKeyDown={(ev) => ev.key === "Enter" && save(m.id)} />
                    <Button size="sm" className="h-8 px-3" onClick={() => save(m.id)}>저장</Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.role || "역할 미설정"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400 hover:text-black px-2"
                        onClick={() => startEdit(m)}>
                        수정
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-300 hover:text-red-500 px-2"
                        onClick={() => deleteMember(m.id)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showAdd ? (
          <div className="flex gap-2 items-center border border-dashed border-gray-300 rounded-xl p-3">
            <Input className="h-8 text-sm flex-1" placeholder="이름"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus />
            <Input className="h-8 text-sm w-24" placeholder="역할"
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <Button size="sm" className="h-8" onClick={handleAdd}>추가</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAdd(false)}>취소</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
            + 팀원 추가
          </button>
        )}
      </div>
    </div>
  );
}
