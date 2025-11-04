// send-invoice route deprecated: automated emailing disabled in favor of manual invoice issuance.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Automated emailing disabled. Use admin Razorpay invoice workflow." }, { status: 410 });
}
