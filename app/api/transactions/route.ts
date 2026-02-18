import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, transactions } from "@/lib/db/schema";
import { parseCategory } from "@/lib/db/queries";
import crypto from "crypto";

const MANUAL_CONNECTION_ID = "manual";

async function ensureManualConnection() {
  const existing = await db
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.id, MANUAL_CONNECTION_ID))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(connections).values({
      id: MANUAL_CONNECTION_ID,
      name: "Manual",
      displayName: "Manual",
      currentBalance: "0",
      isOnBudget: true,
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, amount, date, category, incomeMonth } = body;

  if (!name || amount === undefined || !date) {
    return NextResponse.json(
      { error: "name, amount, and date are required" },
      { status: 400 }
    );
  }

  await ensureManualConnection();

  const id = crypto.randomUUID();

  let categoryType: string | null = null;
  let categoryId: string | null = null;
  if (category) {
    const parsed = parseCategory(category);
    categoryType = parsed.categoryType;
    categoryId = parsed.categoryId;
  }

  await db.insert(transactions).values({
    id,
    connectionId: MANUAL_CONNECTION_ID,
    date,
    name,
    amount: amount.toString(),
    categoryType: categoryType as "bill" | "income" | "everything_else" | "ignore" | "uncategorized" | "fund" | null,
    categoryId,
    incomeMonth: categoryType === "income" ? incomeMonth : null,
    isSplit: false,
  });

  return NextResponse.json({
    id,
    date,
    name,
    amount,
    connectionId: MANUAL_CONNECTION_ID,
    category: category || undefined,
    incomeMonth: categoryType === "income" ? incomeMonth : undefined,
  });
}
