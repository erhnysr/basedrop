import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { drop_id, claimer_address, tx_hash } = body;

  if (!drop_id || !claimer_address || !tx_hash) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({ drop_id, claimer_address, tx_hash })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_claimed_count", { drop_id_input: drop_id });

  return NextResponse.json({ claim: data }, { status: 201 });
}
