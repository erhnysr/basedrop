import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyDropCreated } from "@/lib/verify";

export async function GET() {
  const { data, error } = await supabase
    .from("drops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ drops: data });
}

// Records a drop only after verifying the DropCreated event on Base; every stored
// value (creator, amount, claims, expiry, message, on-chain id) comes from the event.
export async function POST(request: NextRequest) {
  const { tx_hash } = await request.json().catch(() => ({}));
  const ev = await verifyDropCreated(tx_hash);
  if (!ev) return NextResponse.json({ message: "Transaction is not a successful Basedrop drop" }, { status: 400 });

  const row = {
    creator_address: ev.creator,
    amount_per_claim: ev.amountPerClaim,
    total_claims: ev.totalClaims,
    expires_at: ev.expiresAt,
    message: ev.message,
    tx_hash: ev.txHash,
  };

  let { data, error } = await supabase.from("drops").insert({ ...row, onchain_id: ev.dropId }).select().single();
  // Column missing (42703 / PGRST204): migration 0004 not applied yet — store without the link.
  if (error?.code === "42703" || error?.code === "PGRST204") {
    ({ data, error } = await supabase.from("drops").insert(row).select().single());
  }

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ drop: data }, { status: 201 });
}
