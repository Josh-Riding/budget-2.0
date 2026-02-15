import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { parseCategory } from "@/lib/db/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { category, incomeMonth } = body;

  if (!category) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const { categoryType, categoryId } = parseCategory(category);

  await db
    .update(transactions)
    .set({
      categoryType: categoryType as typeof transactions.categoryType.enumValues[number],
      categoryId,
      incomeMonth: categoryType === "income" ? (incomeMonth ?? null) : null,
    })
    .where(eq(transactions.id, id));

  return NextResponse.json({ ok: true });
}
