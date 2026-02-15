import { NextRequest, NextResponse } from "next/server";
import { claimSetupToken } from "@/lib/simplefin";
import { setAppSetting } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const { setupToken } = await request.json();

  if (!setupToken) {
    return NextResponse.json({ error: "setupToken is required" }, { status: 400 });
  }

  try {
    const accessUrl = await claimSetupToken(setupToken);
    await setAppSetting("simplefin_access_url", accessUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to claim token" },
      { status: 400 }
    );
  }
}
