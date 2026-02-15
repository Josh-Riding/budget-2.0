import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, transactionSplits } from "@/lib/db/schema";
import { parseCategory } from "@/lib/db/queries";
import { randomUUID } from "crypto";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { splits } = body as {
    splits: {
      id?: string;
      label?: string;
      amount: number;
      date: string;
      category?: string;
      incomeMonth?: string;
    }[];
  };

  if (!splits || !Array.isArray(splits)) {
    return NextResponse.json({ error: "splits array is required" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    // Delete existing splits
    await tx
      .delete(transactionSplits)
      .where(eq(transactionSplits.transactionId, id));

    // Mark parent as split
    await tx
      .update(transactions)
      .set({ isSplit: true, categoryType: null, categoryId: null })
      .where(eq(transactions.id, id));

    // Insert new splits
    if (splits.length > 0) {
      await tx.insert(transactionSplits).values(
        splits.map((s) => {
          const parsed = s.category
            ? parseCategory(s.category)
            : { categoryType: null, categoryId: null };
          return {
            id: s.id || randomUUID(),
            transactionId: id,
            label: s.label ?? null,
            amount: String(s.amount),
            date: s.date,
            categoryType: (parsed.categoryType as typeof transactionSplits.categoryType.enumValues[number]) ?? null,
            categoryId: parsed.categoryId,
            incomeMonth:
              parsed.categoryType === "income"
                ? (s.incomeMonth ?? null)
                : null,
          };
        })
      );
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.transaction(async (tx) => {
    await tx
      .delete(transactionSplits)
      .where(eq(transactionSplits.transactionId, id));

    await tx
      .update(transactions)
      .set({
        isSplit: false,
        categoryType: "uncategorized",
        categoryId: null,
      })
      .where(eq(transactions.id, id));
  });

  return NextResponse.json({ ok: true });
}
