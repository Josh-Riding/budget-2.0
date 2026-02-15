import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { expectedAmount } = body;

  if (expectedAmount === undefined) {
    return NextResponse.json(
      { error: "expectedAmount is required" },
      { status: 400 }
    );
  }

  await db
    .update(bills)
    .set({
      expectedAmount: expectedAmount.toString(),
    })
    .where(eq(bills.id, id));

  return NextResponse.json({ ok: true });
}
