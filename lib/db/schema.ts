import {
  pgTable,
  pgEnum,
  text,
  numeric,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit",
  "investment",
  "retirement",
]);

export const categoryTypeEnum = pgEnum("category_type", [
  "bill",
  "income",
  "everything_else",
  "ignore",
  "uncategorized",
  "fund",
]);

// Tables
export const connections = pgTable("connections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  isOnBudget: boolean("is_on_budget").notNull().default(true),
  accountType: accountTypeEnum("account_type"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").references(() => connections.id, {
    onDelete: "cascade",
  }),
  date: date("date").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  categoryType: categoryTypeEnum("category_type"),
  categoryId: text("category_id"),
  incomeMonth: text("income_month"),
  isSplit: boolean("is_split").notNull().default(false),
});

export const transactionSplits = pgTable("transaction_splits", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  label: text("label"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  categoryType: categoryTypeEnum("category_type"),
  categoryId: text("category_id"),
  incomeMonth: text("income_month"),
});

export const bills = pgTable("bills", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  expectedAmount: numeric("expected_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  month: text("month"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
  paidDate: date("paid_date"),
});

export const funds = pgTable("funds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const fundAllocations = pgTable("fund_allocations", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => funds.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

export const sealedMonths = pgTable("sealed_months", {
  id: text("id").primaryKey(),
  month: text("month").notNull().unique(),
  sealedAt: timestamp("sealed_at").notNull().defaultNow(),
});

export const fundSettings = pgTable("fund_settings", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => funds.id, { onDelete: "cascade" })
    .unique(),
  displayName: text("display_name").notNull(),
  position: text("position").notNull(), // "left" or "right"
  isVisible: boolean("is_visible").notNull().default(true),
  overrideAmount: numeric("override_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Relations
export const connectionsRelations = relations(connections, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    connection: one(connections, {
      fields: [transactions.connectionId],
      references: [connections.id],
    }),
    splits: many(transactionSplits),
  })
);

export const transactionSplitsRelations = relations(
  transactionSplits,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionSplits.transactionId],
      references: [transactions.id],
    }),
  })
);

export const fundsRelations = relations(funds, ({ many }) => ({
  allocations: many(fundAllocations),
}));

export const fundAllocationsRelations = relations(
  fundAllocations,
  ({ one }) => ({
    fund: one(funds, {
      fields: [fundAllocations.fundId],
      references: [funds.id],
    }),
  })
);
