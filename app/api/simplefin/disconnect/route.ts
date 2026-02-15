import { NextResponse } from "next/server";
import { deleteAppSetting } from "@/lib/db/queries";

export async function POST() {
  await deleteAppSetting("simplefin_access_url");
  return NextResponse.json({ ok: true });
}
