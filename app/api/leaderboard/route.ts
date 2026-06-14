import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const [creatorsRes, claimersRes] = await Promise.all([
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
  ]);

  if (creatorsRes.error) {
    return NextResponse.json({ message: creatorsRes.error.message }, { status: 500 });
  }
  if (claimersRes.error) {
    return NextResponse.json({ message: claimersRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    creators: creatorsRes.data,
    claimers: claimersRes.data,
  });
}
