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

  const { data, error } = await supabase
    .from("drops")
    .insert({
      creator_address,
      amount_per_claim,
      total_claims,
      expires_at,
      message,
      tx_hash,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ drop: data }, { status: 201 });
}
