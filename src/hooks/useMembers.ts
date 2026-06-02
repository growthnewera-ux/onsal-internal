"use client";

import { useState, useEffect } from "react";

export interface Member {
  id: number;
  name: string;
  role: string;
  color: string;
  order: number;
}

export const COLOR_MAP: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  pink: "bg-pink-100 text-pink-700",
  gray: "bg-gray-100 text-gray-700",
  black: "bg-black text-white",
};

export const COLORS = ["purple", "blue", "green", "orange", "pink", "gray"];

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  const load = () => {
    fetch("/api/members").then((r) => r.json()).then(setMembers);
  };

  useEffect(() => { load(); }, []);

  const addMember = async (name: string, role: string) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    const added = await res.json();
    setMembers((prev) => [...prev, added]);
  };

  const updateMember = async (id: number, name: string, role: string) => {
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, role }),
    });
    const updated = await res.json();
    setMembers((prev) => prev.map((m) => m.id === id ? updated : m));
  };

  const deleteMember = async (id: number) => {
    await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return { members, addMember, updateMember, deleteMember, reload: load };
}
