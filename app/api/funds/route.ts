import { NextRequest, NextResponse } from "next/server";
import {
  getFundBalances,
  createFund,
  deleteFund,
} from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const balances = await getFundBalances();

    const enrichedFunds = balances.map((b) => ({
      id: b.fundId,
      name: b.name,
      currentBalance: b.balance,
      displayName: b.name,
      position: b.position,
    }));

    return NextResponse.json(enrichedFunds);
  } catch (error) {
    console.error("Error in GET /api/funds:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const newFund = await createFund(name);
  return NextResponse.json(newFund);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { fundId } = body;

  if (!fundId) {
    return NextResponse.json(
      { error: "fundId is required" },
      { status: 400 }
    );
  }

  await deleteFund(fundId);
  return NextResponse.json({ ok: true });
}
