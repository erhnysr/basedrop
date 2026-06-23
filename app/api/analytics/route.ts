import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const [dropsResult, claimsResult, amountsResult] = await Promise.all([
    supabase.from("drops").select("*", { count: "exact", head: true }),
    supabase.from("claims").select("*", { count: "exact", head: true }),
    supabase.from("drops").select("amount_per_claim, claimed_count"),
  ]);

  if (dropsResult.error || claimsResult.error || amountsResult.error) {
    const err =
      dropsResult.error ?? claimsResult.error ?? amountsResult.error;
    return NextResponse.json({ message: err!.message }, { status: 500 });
  }

  const total_usdc_dropped = (amountsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_per_claim) * row.claimed_count,
    0,
  );

  return NextResponse.json({
    total_drops: dropsResult.count ?? 0,
    total_claims: claimsResult.count ?? 0,
    total_usdc_dropped: Number(total_usdc_dropped.toFixed(6)),
  });
}
