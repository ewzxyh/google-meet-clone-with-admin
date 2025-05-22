import { supabaseServer } from "@/lib/supabase"
import AdminPanel, { type Meeting } from "@/components/admin-panel"

export default async function AdminPage() {
  // Fetch all meetings with error handling
  let meetings: Meeting[] = []

  if (!supabaseServer) {
    console.warn("Supabase client not initialized. Using empty meetings list.")
    return <AdminPanel meetings={meetings} />
  }

  try {
    const { data, error } = await supabaseServer.from("meetings").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      meetings = data
    } else if (error) {
      console.error("Error fetching meetings:", error)
    }
  } catch (error) {
    console.error("Error in admin page:", error)
  }

  return <AdminPanel meetings={meetings} />
}
