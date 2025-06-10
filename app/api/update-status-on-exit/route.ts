import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anôn key are not defined");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const { meetingId } = await req.json();

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required" }, { status: 400 });
    }

    // Update meeting status to "ended"
    const { error } = await supabase
      .from("meetings")
      .update({ status: "ended" })
      .eq("meeting_id", meetingId);

    if (error) {
      console.error("Error updating meeting status:", error);
      return NextResponse.json({ error: "Failed to update meeting status" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/update-status-on-exit:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 