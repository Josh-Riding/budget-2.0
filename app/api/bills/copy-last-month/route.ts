import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { getBillsForMonth } from "@/lib/db/queries";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { currentMonth } = body;

  if (!currentMonth) {
    return NextResponse.json(
      { error: "currentMonth is required (format: MM/YYYY)" },
      { status: 400 }
    );
  }

  // Parse current month and calculate previous month
  const [mm, yyyy] = currentMonth.split("/");
  const currentMonthNum = parseInt(mm);
  const currentYear = parseInt(yyyy);

  let prevMonthNum = currentMonthNum - 1;
  let prevYear = currentYear;
  if (prevMonthNum === 0) {
    prevMonthNum = 12;
    prevYear = currentYear - 1;
  }

  const prevMonthStr = `${String(prevMonthNum).padStart(2, "0")}/${prevYear}`;

  await db.transaction(async (tx) => {
    // Source bills from previous month
    const prevMonthBills = await tx
      .select()
      .from(bills)
      .where(eq(bills.month, prevMonthStr));

    // Existing bills for current month
    const currentMonthBills = await tx
      .select()
      .from(bills)
      .where(eq(bills.month, currentMonth));

    const normalizeName = (name: string) => name.trim().toLowerCase();

    // Keep one current bill per name; delete duplicates later
    const currentByName = new Map<string, typeof currentMonthBills[number]>();
    const duplicateCurrentIds: string[] = [];
    for (const bill of currentMonthBills) {
      const key = normalizeName(bill.name);
      if (!currentByName.has(key)) {
        currentByName.set(key, bill);
      } else {
        duplicateCurrentIds.push(bill.id);
      }
    }

    const prevNames = new Set(prevMonthBills.map((b) => normalizeName(b.name)));
    const seenCurrentIds = new Set<string>();

    // Upsert last month's bills into current month, preserving current IDs when names match
    for (const prevBill of prevMonthBills) {
      const key = normalizeName(prevBill.name);
      const existing = currentByName.get(key);

      if (existing) {
        seenCurrentIds.add(existing.id);
        await tx
          .update(bills)
          .set({
            name: prevBill.name,
            expectedAmount: prevBill.expectedAmount,
          })
          .where(eq(bills.id, existing.id));
      } else {
        await tx.insert(bills).values({
          id: crypto.randomUUID(),
          name: prevBill.name,
          expectedAmount: prevBill.expectedAmount,
          month: currentMonth,
        });
      }
    }

    // Remove current-month bills not present in previous month
    for (const currentBill of currentMonthBills) {
      const key = normalizeName(currentBill.name);
      if (!prevNames.has(key) || duplicateCurrentIds.includes(currentBill.id)) {
        await tx
          .delete(bills)
          .where(and(eq(bills.id, currentBill.id), eq(bills.month, currentMonth)));
      } else if (!seenCurrentIds.has(currentBill.id)) {
        await tx
          .delete(bills)
          .where(and(eq(bills.id, currentBill.id), eq(bills.month, currentMonth)));
      }
    }
  });

  // Return fresh bill rows with paid amounts recalculated
  const refreshedBills = await getBillsForMonth(currentMonth);
  return NextResponse.json(refreshedBills);
}
