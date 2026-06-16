import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function POST(req: NextRequest) {
  const { referrer_address, referee_address, drop_id } = await req.json();

  if (!referrer_address || !referee_address || drop_id === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // No self-referrals
  if (referrer_address.toLowerCase() === referee_address.toLowerCase()) {
    return NextResponse.json({ ok: false, reason: "self_referral" });
  }

  const { error } = await supabase.from("referrals").insert({
    referrer_address: referrer_address.toLowerCase(),
    referee_address: referee_address.toLowerCase(),
    drop_id: Number(drop_id),
    points: 1,
  });

  if (error) {
    // Unique violation → already recorded
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
