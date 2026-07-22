import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fundAllocations, sealedMonths } from "@/lib/db/schema";
import { getUncategorizedCount, isMonthSealed } from "@/lib/db/queries";
import { buildFundAllocationInserts } from "@/lib/allocations";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { month, allocations } = body as {
    month: string;
    allocations: { fundId: string; amount: number }[];
  };

  if (!month || !allocations) {
    return NextResponse.json(
      { error: "month and allocations are required" },
      { status: 400 }
    );
  }

  // Validate month format MM/YYYY
  if (!/^\d{2}\/\d{4}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month format. Use MM/YYYY" },
      { status: 400 }
    );
  }

  // Check month is in the past
  const [mm, yyyy] = month.split("/");
  const monthEnd = new Date(parseInt(yyyy), parseInt(mm), 1); // First of next month
  if (monthEnd > new Date()) {
    return NextResponse.json(
      { error: "Cannot seal a month that hasn't ended" },
      { status: 400 }
    );
  }

  // Check not already sealed
  const sealed = await isMonthSealed(month);
  if (sealed) {
    return NextResponse.json(
      { error: "Month is already sealed" },
      { status: 400 }
    );
  }

  // Check no uncategorized transactions
  const uncatCount = await getUncategorizedCount(month);
  if (uncatCount > 0) {
    return NextResponse.json(
      { error: `${uncatCount} uncategorized transactions remain` },
      { status: 400 }
    );
  }

  // Only insert non-zero allocations. A zero/negative month yields an empty
  // list — inserting an empty array would throw, so guard on the filtered rows.
  const allocationRows = buildFundAllocationInserts(month, allocations);

  // Insert allocations + sealed month in a transaction
  await db.transaction(async (tx) => {
    if (allocationRows.length > 0) {
      await tx.insert(fundAllocations).values(
        allocationRows.map((r) => ({
          id: randomUUID(),
          ...r,
        }))
      );
    }

    await tx.insert(sealedMonths).values({
      id: randomUUID(),
      month,
    });
  });

  return NextResponse.json({ ok: true });
}
