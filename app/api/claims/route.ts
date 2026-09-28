import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyClaim } from "@/lib/verify";

// Records a claim only after verifying the Claimed event on Base. The drop id and
// claimer come from the event; claims.drop_id is mapped to the Supabase drops row
// through drops.onchain_id.
export async function POST(request: NextRequest) {
  const { tx_hash } = await request.json().catch(() => ({}));
  const claim = await verifyClaim(tx_hash);
  if (!claim) return NextResponse.json({ message: "Transaction is not a successful Basedrop claim" }, { status: 400 });

  const { data: drop, error: lookupError } = await supabase.from("drops").select("id").eq("onchain_id", claim.dropId).maybeSingle();
  if (lookupError || !drop) {
    return NextResponse.json({ recorded: false, reason: lookupError ? "lookup_failed" : "unlinked_drop" }, { status: 202 });
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({ drop_id: drop.id, claimer_address: claim.claimer, tx_hash: claim.txHash })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true }); // already recorded
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_claimed_count", { drop_id_input: drop.id });
  return NextResponse.json({ claim: data }, { status: 201 });
}
