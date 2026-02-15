import { NextRequest, NextResponse } from "next/server";
import { updateFundSettings } from "@/lib/db/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  const { fundId } = await params;
  const body = await request.json();
  const { displayName, position, isVisible, overrideAmount } = body;

  if (!displayName || !position) {
    return NextResponse.json(
      { error: "displayName and position are required" },
      { status: 400 }
    );
  }

  await updateFundSettings(
    fundId,
    displayName,
    position,
    isVisible ?? true,
    overrideAmount
  );

  return NextResponse.json({ ok: true });
}
