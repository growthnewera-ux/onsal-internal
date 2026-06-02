"use client";

import { useState } from "react";
import SalesTab from "./tabs/SalesTab";
import TasksTab from "./tabs/TasksTab";
import MeetingsTab from "./tabs/MeetingsTab";
import ExpensesTab from "./tabs/ExpensesTab";

const TABS = [
  { id: "sales", label: "📊 매출 현황" },
  { id: "tasks", label: "✅ 팀 업무" },
  { id: "meetings", label: "📋 회의 액션" },
  { id: "expenses", label: "💰 팀 비용" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">온살</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">온살팀 대시보드</h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "tasks" && <TasksTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "expenses" && <ExpensesTab />}
      </main>
    </div>
  );
}
