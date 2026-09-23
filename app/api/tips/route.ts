import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tipper_address, recipient_address, amount, tx_hash } = body;

  if (!tipper_address || !recipient_address || !amount || !tx_hash) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tips")
    .insert({
      tipper_address: tipper_address.toLowerCase(),
      recipient_address: recipient_address.toLowerCase(),
      amount: Number(amount),
      tx_hash,
    })
    .select()
    .single();

  if (error) {
    // tx_hash unique constraint — duplicate tip, treat as success (idempotent)
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tip: data }, { status: 201 });
}
