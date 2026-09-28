import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyUsdcTransfer } from "@/lib/verify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipient = searchParams.get("recipient");
  const tipper = searchParams.get("tipper");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  let query = supabase
    .from("tips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (recipient) query = query.eq("recipient_address", recipient.toLowerCase());
  if (tipper) query = query.eq("tipper_address", tipper.toLowerCase());

  const { data, error } = await query;

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ tips: data });
}

// Records a tip only after verifying the USDC Transfer on Base; tipper, recipient
// and amount come from the event.
export async function POST(request: NextRequest) {
  const { tx_hash } = await request.json().catch(() => ({}));
  const t = await verifyUsdcTransfer(tx_hash);
  if (!t) return NextResponse.json({ message: "Transaction is not a successful USDC transfer" }, { status: 400 });

  const { data, error } = await supabase
    .from("tips")
    .insert({ tipper_address: t.from, recipient_address: t.to, amount: t.amount, tx_hash: t.txHash })
    .select()
    .single();

  if (error) {
    // tx_hash unique constraint — duplicate tip, treat as success (idempotent)
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tip: data }, { status: 201 });
}
