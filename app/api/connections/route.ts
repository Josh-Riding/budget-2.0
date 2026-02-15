import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const { id, name, accountType, isOnBudget } = body;

  if (!id || !name) {
    return NextResponse.json(
      { error: "id and name are required" },
      { status: 400 }
    );
  }

  await db.insert(connections).values({
    id,
    name,
    currentBalance: "0",
    isOnBudget: isOnBudget ?? true,
    accountType: accountType ?? null,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
