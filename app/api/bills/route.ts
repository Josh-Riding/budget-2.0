import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { Bill } from "@/lib/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, expectedAmount, month } = body;

  if (!name || expectedAmount === undefined || !month) {
    return NextResponse.json(
      { error: "name, expectedAmount, and month are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await db.insert(bills).values({
    id,
    name,
    expectedAmount: expectedAmount.toString(),
    month,
  });

  const newBill: Bill = {
    id,
    name,
    expectedAmount,
  };

  return NextResponse.json(newBill);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.delete(bills).where(eq(bills.id, id));

  return NextResponse.json({ ok: true });
}
