import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const [creatorsRes, claimersRes, tippersRes] = await Promise.all([
    supabase
      .from("leaderboard_creators")
      .select("*")
      .order("total_dropped", { ascending: false })
      .limit(10),
    supabase
      .from("leaderboard_claimers")
      .select("*")
      .order("total_claimed", { ascending: false })
      .limit(10),
    supabase
      .from("leaderboard_tippers")
      .select("tipper_address, total_tipped, tip_count")
      .limit(10),
  ]);

  if (creatorsRes.error) {
    return NextResponse.json({ message: creatorsRes.error.message }, { status: 500 });
  }
  if (claimersRes.error) {
    return NextResponse.json({ message: claimersRes.error.message }, { status: 500 });
  }
  // Tippers view is shared with tipping.base; tolerate its absence rather than 500 the whole board.
  const tippers = tippersRes.error ? [] : tippersRes.data;

  return NextResponse.json({
    creators: creatorsRes.data,
    claimers: claimersRes.data,
    tippers,
  });
}
