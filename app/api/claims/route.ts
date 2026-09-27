import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// drop_id in the request is the ON-CHAIN escrow id. claims.drop_id references
// the Supabase drops row, so map it through drops.onchain_id first.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { drop_id, claimer_address, tx_hash } = body;

  if (drop_id === undefined || drop_id === null || !claimer_address || !tx_hash) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data: drop, error: lookupError } = await supabase
    .from("drops")
    .select("id")
    .eq("onchain_id", Number(drop_id))
    .maybeSingle();

  if (lookupError || !drop) {
    // Unlinked drop (created before migration 0004) or migration not applied:
    // skip rather than attach the claim to the wrong drop.
    return NextResponse.json({ recorded: false, reason: lookupError ? "lookup_failed" : "unlinked_drop" }, { status: 202 });
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({ drop_id: drop.id, claimer_address: String(claimer_address).toLowerCase(), tx_hash })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_claimed_count", { drop_id_input: drop.id });

  return NextResponse.json({ claim: data }, { status: 201 });
}
