import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { supabase } from "@/lib/supabase";
import { verifyClaim } from "@/lib/verify";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const { data, error } = await supabase
    .from("leaderboard_referrals")
    .select("total_points, referral_count")
    .eq("referrer_address", address.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    total_points: data?.total_points ?? 0,
    referral_count: data?.referral_count ?? 0,
  });
}

// Credits a referral only for a verified claim: the referee and drop come from the
// claim's on-chain event, so points can't be minted with made-up addresses.
export async function POST(req: NextRequest) {
  const { referrer_address, tx_hash } = await req.json().catch(() => ({}));
  if (typeof referrer_address !== "string" || !isAddress(referrer_address)) {
    return NextResponse.json({ error: "Invalid referrer" }, { status: 400 });
  }
  const claim = await verifyClaim(tx_hash);
  if (!claim) return NextResponse.json({ error: "Transaction is not a successful Basedrop claim" }, { status: 400 });

  const referrer = referrer_address.toLowerCase();
  if (referrer === claim.claimer) return NextResponse.json({ ok: false, reason: "self_referral" });

  const { error } = await supabase.from("referrals").insert({
    referrer_address: referrer,
    referee_address: claim.claimer,
    drop_id: claim.dropId,
    points: 1,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
