"use client"

import { useState, useEffect } from "react"
import { supabaseServer } from "@/lib/supabase"
import { getSupabaseBrowser } from "@/lib/supabase"
import AdminPanel, { type Meeting } from "@/components/admin-panel"

export default function AdminPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInitialMeetings = async () => {
      try {
        const supabase = getSupabaseBrowser()

        if (!supabase) {
          console.warn("Supabase client not initialized. Using empty meetings list.")
          setMeetings([])
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .order("created_at", { ascending: false })

        if (!error && data) {
          // Traduzir status para português
          const translatedMeetings: Meeting[] = data.map((meeting: any) => ({
            ...meeting,
            status: meeting.status === 'active' ? 'Ativado' : 
                    meeting.status === 'ended' ? 'Finalizado' : 
                    meeting.status
          }))
          setMeetings(translatedMeetings)
        } else if (error) {
          console.error("Error fetching meetings:", error)
        }
      } catch (error) {
        console.error("Error in admin page:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialMeetings()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-700 mx-auto mb-4"></div>
            <p className="text-sky-700 font-medium">Carregando reuniões...</p>
          </div>
        </div>
      </div>
    )
  }

  return <AdminPanel meetings={meetings} />
}
