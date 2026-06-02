import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";

// 팀원 설정
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  color: text("color").notNull().default("gray"),
  order: integer("order").notNull().default(0),
});

// 매출 데이터
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(), // "2026-06"
  target: integer("target").notNull().default(0),
  actual: integer("actual").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 팀 업무
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  assignee: text("assignee").notNull(),
  title: text("title").notNull(),
  dueDate: date("due_date"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 회의
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 회의 액션아이템
export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  content: text("content").notNull(),
  assignee: text("assignee").notNull(),
  dueDate: date("due_date"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 월별 예산
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(), // "2026-06"
  totalBudget: integer("total_budget").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 카테고리별 예산
export const categoryBudgets = pgTable("category_budgets", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // "2026-06"
  category: text("category").notNull(),
  budget: integer("budget").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 팀 비용
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
