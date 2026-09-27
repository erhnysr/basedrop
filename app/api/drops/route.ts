import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    creator_address,
    amount_per_claim,
    total_claims,
    expires_at,
    message,
    tx_hash,
    onchain_id,
  } = body;

  if (
    !creator_address ||
    amount_per_claim === undefined ||
    total_claims === undefined ||
    !expires_at ||
    !tx_hash
  ) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const row = {
    creator_address: String(creator_address).toLowerCase(),
    amount_per_claim,
    total_claims,
    expires_at,
    message,
    tx_hash,
  };
  const withId = onchain_id !== undefined && onchain_id !== null ? { ...row, onchain_id: Number(onchain_id) } : row;

  let { data, error } = await supabase.from("drops").insert(withId).select().single();
  // Column missing (42703 / PGRST204): migration 0004 not applied yet — store without the link.
  if ((error?.code === "42703" || error?.code === "PGRST204") && withId !== row) {
    ({ data, error } = await supabase.from("drops").insert(row).select().single());
  }

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ drop: data }, { status: 201 });
}
