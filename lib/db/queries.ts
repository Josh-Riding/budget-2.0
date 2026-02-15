import { eq, desc, and, gte, lt, sql, inArray, sum, count } from "drizzle-orm";
import { db } from ".";
import {
  connections,
  transactions,
  transactionSplits,
  bills,
  funds,
  fundAllocations,
  sealedMonths,
  fundSettings,
} from "./schema";
import type {
  SimpleFinConnection,
  AvailableSimpleFinConnection,
  Transaction,
  Bill,
} from "@/lib/types";

function mapCategory(
  categoryType: string | null,
  categoryId: string | null
): string | undefined {
  if (!categoryType) return undefined;
  if (categoryType === "bill" && categoryId) return categoryId;
  if (categoryType === "fund" && categoryId) return `fund:${categoryId}`;
  return categoryType;
}

export function parseCategory(category: string): {
  categoryType: string;
  categoryId: string | null;
} {
  if (
    category === "income" ||
    category === "everything_else" ||
    category === "ignore" ||
    category === "uncategorized"
  ) {
    return { categoryType: category, categoryId: null };
  }
  if (category.startsWith("fund:")) {
    const fundId = category.slice(5);
    return { categoryType: "fund", categoryId: fundId };
  }
  return { categoryType: "bill", categoryId: category };
}

function getMonthDateRange(month: string): { start: string; end: string } {
  const [mm, yyyy] = month.split("/");
  const year = parseInt(yyyy);
  const mon = parseInt(mm);
  const start = `${yyyy}-${mm}-01`;
  const nextMonth = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

export async function getSimpleFinConnections(): Promise<
  SimpleFinConnection[]
> {
  const rows = await db.select().from(connections);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    currentBalance: Number(r.currentBalance),
    isOnBudget: r.isOnBudget,
    accountType: r.accountType ?? undefined,
  }));
}

export async function getConnection(
  connectionId: string
): Promise<SimpleFinConnection | undefined> {
  const rows = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1);
  const r = rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    name: r.name,
    currentBalance: Number(r.currentBalance),
    isOnBudget: r.isOnBudget,
    accountType: r.accountType ?? undefined,
  };
}

export async function getConnectionTransactions(
  connectionId: string
): Promise<Transaction[]> {
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.connectionId, connectionId),
    with: { splits: true },
    orderBy: [desc(transactions.date)],
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    amount: Number(r.amount),
    category: mapCategory(r.categoryType, r.categoryId),
    incomeMonth: r.incomeMonth ?? undefined,
    isSplit: r.isSplit || undefined,
    connectionId: r.connectionId ?? undefined,
    splits: r.splits.length
      ? r.splits.map((s) => ({
          id: s.id,
          label: s.label ?? undefined,
          amount: Number(s.amount),
          date: s.date,
          category: mapCategory(s.categoryType, s.categoryId),
          incomeMonth: s.incomeMonth ?? undefined,
        }))
      : undefined,
  }));
}

export async function getBills(): Promise<Bill[]> {
  const rows = await db.select().from(bills);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    expectedAmount: Number(r.expectedAmount),
    paidAmount: r.paidAmount ? Number(r.paidAmount) : undefined,
    date: r.paidDate ?? undefined,
  }));
}

export async function getAvailableSimpleFinConnections(): Promise<
  AvailableSimpleFinConnection[]
> {
  // Placeholder — will be replaced with SimpleFin API integration
  return [];
}

export async function getAllOnBudgetTransactions(): Promise<Transaction[]> {
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const ids = onBudget.map((c) => c.id);
  if (ids.length === 0) return [];

  const rows = await db.query.transactions.findMany({
    where: inArray(transactions.connectionId, ids),
    with: { splits: true },
    orderBy: [desc(transactions.date)],
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    amount: Number(r.amount),
    category: mapCategory(r.categoryType, r.categoryId),
    incomeMonth: r.incomeMonth ?? undefined,
    isSplit: r.isSplit || undefined,
    connectionId: r.connectionId ?? undefined,
    splits: r.splits.length
      ? r.splits.map((s) => ({
          id: s.id,
          label: s.label ?? undefined,
          amount: Number(s.amount),
          date: s.date,
          category: mapCategory(s.categoryType, s.categoryId),
          incomeMonth: s.incomeMonth ?? undefined,
        }))
      : undefined,
  }));
}

export async function getOnBudgetTransactionsForMonth(
  month: string
): Promise<Transaction[]> {
  const { start, end } = getMonthDateRange(month);
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const ids = onBudget.map((c) => c.id);
  if (ids.length === 0) return [];

  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.connectionId, ids),
      gte(transactions.date, start),
      lt(transactions.date, end)
    ),
    with: { splits: true },
    orderBy: [desc(transactions.date)],
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    amount: Number(r.amount),
    category: mapCategory(r.categoryType, r.categoryId),
    incomeMonth: r.incomeMonth ?? undefined,
    isSplit: r.isSplit || undefined,
    connectionId: r.connectionId ?? undefined,
    splits: r.splits.length
      ? r.splits.map((s) => ({
          id: s.id,
          label: s.label ?? undefined,
          amount: Number(s.amount),
          date: s.date,
          category: mapCategory(s.categoryType, s.categoryId),
          incomeMonth: s.incomeMonth ?? undefined,
        }))
      : undefined,
  }));
}

export async function getUncategorizedCount(month: string): Promise<number> {
  const { start, end } = getMonthDateRange(month);
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const ids = onBudget.map((c) => c.id);
  if (ids.length === 0) return 0;

  // Count non-split uncategorized transactions
  const nonSplitResult = await db
    .select({ count: count() })
    .from(transactions)
    .where(
      and(
        inArray(transactions.connectionId, ids),
        gte(transactions.date, start),
        lt(transactions.date, end),
        eq(transactions.categoryType, "uncategorized"),
        eq(transactions.isSplit, false)
      )
    );

  // Count uncategorized splits belonging to on-budget transactions
  const splitResult = await db
    .select({ count: count() })
    .from(transactionSplits)
    .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
    .where(
      and(
        inArray(transactions.connectionId, ids),
        gte(transactionSplits.date, start),
        lt(transactionSplits.date, end),
        sql`(${transactionSplits.categoryType} = 'uncategorized' OR ${transactionSplits.categoryType} IS NULL)`
      )
    );

  return (nonSplitResult[0]?.count ?? 0) + (splitResult[0]?.count ?? 0);
}

export async function isMonthSealed(month: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(sealedMonths)
    .where(eq(sealedMonths.month, month))
    .limit(1);
  return rows.length > 0;
}

export async function getFunds(): Promise<{ id: string; name: string }[]> {
  return db.select().from(funds);
}

export async function getFundBalances(): Promise<
  { fundId: string; name: string; balance: number; position: string }[]
> {
  const allFunds = await db.select().from(funds);
  const settings = await db.select().from(fundSettings);

  // Get allocations (deposits to funds)
  const allocations = await db
    .select({
      fundId: fundAllocations.fundId,
      total: sum(fundAllocations.amount),
    })
    .from(fundAllocations)
    .groupBy(fundAllocations.fundId);

  const allocMap = new Map(
    allocations.map((a) => [a.fundId, Number(a.total ?? 0)])
  );

  // Get fund spending (transactions categorized to funds)
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const onBudgetIds = onBudget.map((c) => c.id);

  const fundSpending = onBudgetIds.length > 0
    ? await db
        .select({
          fundId: transactions.categoryId,
          total: sum(transactions.amount),
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.connectionId, onBudgetIds),
            eq(transactions.categoryType, "fund")
          )
        )
        .groupBy(transactions.categoryId)
    : [];

  const spendingMap = new Map(
    fundSpending.map((s) => [s.fundId, Number(s.total ?? 0)])
  );

  const settingsMap = new Map(
    settings.map((s) => [s.fundId, s])
  );

  // Default positions for the original 4 funds
  const defaultPositions: Record<string, string> = {
    "fund-madison": "left",
    "fund-josh": "left",
    "fund-house": "right",
    "fund-travel": "right",
  };

  return allFunds.map((f) => {
    const setting = settingsMap.get(f.id);
    const startingBalance = setting?.overrideAmount != null ? Number(setting.overrideAmount) : (allocMap.get(f.id) ?? 0);
    const balance = startingBalance + (spendingMap.get(f.id) ?? 0);

    return {
      fundId: f.id,
      name: setting?.displayName ?? f.name,
      balance,
      position: setting?.position ?? defaultPositions[f.id] ?? "right",
    };
  });
}

export async function getBillsForMonth(month: string): Promise<Bill[]> {
  const { start, end } = getMonthDateRange(month);
  const billRows = await db
    .select()
    .from(bills)
    .where(eq(bills.month, month));

  // Get paid amounts and dates from transactions for each bill
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const onBudgetIds = onBudget.map((c) => c.id);
  if (onBudgetIds.length === 0) {
    return billRows.map((r) => ({
      id: r.id,
      name: r.name,
      expectedAmount: Number(r.expectedAmount),
      paidAmount: undefined,
      date: undefined,
    }));
  }

  const paidByBill = await db
    .select({
      billId: transactions.categoryId,
      total: sum(transactions.amount),
      transactionDate: sql<string>`max(${transactions.date})`,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.connectionId, onBudgetIds),
        eq(transactions.categoryType, "bill"),
        gte(transactions.date, start),
        lt(transactions.date, end)
      )
    )
    .groupBy(transactions.categoryId);

  const splitPaidByBill = await db
    .select({
      billId: transactionSplits.categoryId,
      total: sum(transactionSplits.amount),
      transactionDate: sql<string>`max(${transactionSplits.date})`,
    })
    .from(transactionSplits)
    .innerJoin(
      transactions,
      eq(transactionSplits.transactionId, transactions.id)
    )
    .where(
      and(
        inArray(transactions.connectionId, onBudgetIds),
        eq(transactionSplits.categoryType, "bill"),
        gte(transactionSplits.date, start),
        lt(transactionSplits.date, end)
      )
    )
    .groupBy(transactionSplits.categoryId);

  const paidMap = new Map<
    string,
    { amount: number; date: string }
  >();
  [...paidByBill, ...splitPaidByBill].forEach((p) => {
    if (!p.billId) return;
    const existing = paidMap.get(p.billId);
    const amount = Math.abs(Number(p.total ?? 0));
    const date = p.transactionDate ?? "";
    if (!existing) {
      paidMap.set(p.billId, {
        amount,
        date,
      });
      return;
    }
    paidMap.set(p.billId, {
      amount: existing.amount + amount,
      date: existing.date >= date ? existing.date : date,
    });
  });

  return billRows.map((r) => ({
    id: r.id,
    name: r.name,
    expectedAmount: Number(r.expectedAmount),
    paidAmount: paidMap.get(r.id)?.amount,
    date: paidMap.get(r.id)?.date,
  }));
}

export async function getIncomeForMonth(month: string): Promise<number> {
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const ids = onBudget.map((c) => c.id);
  if (ids.length === 0) return 0;

  const result = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        inArray(transactions.connectionId, ids),
        eq(transactions.categoryType, "income"),
        eq(transactions.incomeMonth, month)
      )
    );
  return Number(result[0]?.total ?? 0);
}

export async function getFundSettings(): Promise<
  { fundId: string; displayName: string; position: string; isVisible: boolean; overrideAmount?: number }[]
> {
  const rows = await db.select().from(fundSettings);
  return rows.map((r) => ({
    fundId: r.fundId,
    displayName: r.displayName,
    position: r.position,
    isVisible: r.isVisible,
    overrideAmount: r.overrideAmount ? Number(r.overrideAmount) : undefined,
  }));
}

export async function updateFundSettings(
  fundId: string,
  displayName: string,
  position: string,
  isVisible: boolean,
  overrideAmount?: number
): Promise<void> {
  await db
    .insert(fundSettings)
    .values({
      id: `settings-${fundId}`,
      fundId,
      displayName,
      position,
      isVisible,
      overrideAmount: overrideAmount ? overrideAmount.toString() : null,
    })
    .onConflictDoUpdate({
      target: fundSettings.fundId,
      set: {
        displayName,
        position,
        isVisible,
        overrideAmount: overrideAmount ? overrideAmount.toString() : null,
      },
    });
}

export async function createFund(name: string): Promise<{ id: string; name: string }> {
  const id = `fund-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  await db.insert(funds).values({
    id,
    name,
  });
  return { id, name };
}

export async function deleteFund(fundId: string): Promise<void> {
  await db.delete(funds).where(eq(funds.id, fundId));
}

export async function getExpensesForMonth(month: string): Promise<number> {
  const { start, end } = getMonthDateRange(month);
  const onBudget = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.isOnBudget, true));
  const ids = onBudget.map((c) => c.id);
  if (ids.length === 0) return 0;

  // Sum non-split transactions with bill or everything_else category
  const nonSplit = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        inArray(transactions.connectionId, ids),
        gte(transactions.date, start),
        lt(transactions.date, end),
        eq(transactions.isSplit, false),
        sql`${transactions.categoryType} IN ('bill', 'everything_else')`
      )
    );

  // Sum split sub-transactions with bill or everything_else category
  const splitRows = await db
    .select({ total: sum(transactionSplits.amount) })
    .from(transactionSplits)
    .innerJoin(
      transactions,
      eq(transactionSplits.transactionId, transactions.id)
    )
    .where(
      and(
        inArray(transactions.connectionId, ids),
        gte(transactionSplits.date, start),
        lt(transactionSplits.date, end),
        sql`${transactionSplits.categoryType} IN ('bill', 'everything_else')`
      )
    );

  return Number(nonSplit[0]?.total ?? 0) + Number(splitRows[0]?.total ?? 0);
}
