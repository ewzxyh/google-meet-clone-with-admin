import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a single supabase client for server-side with proper error handling
export const supabaseServer =
  supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey || "")
    : null

// Create a singleton instance for client-side
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowser = () => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// Mock data for when Supabase is not available
export const mockMeetingData = {
  meeting_id: "mock-meeting",
  status: "active",
  video_url: "",
  created_at: new Date().toISOString(),
}
