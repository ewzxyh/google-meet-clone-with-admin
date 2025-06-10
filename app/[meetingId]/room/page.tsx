"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import MeetingRoom from "@/components/meeting-room"
import LoadingScreen from "@/components/loading-screen"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Meeting } from "@/components/admin-panel"

export default function RoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get("name")
  const [isLoading, setIsLoading] = useState(true)
  const [meetingData, setMeetingData] = useState<Meeting | null>(null)
  const [lastPosition, setLastPosition] = useState(0)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const confirmationMessage = "Caso feche a reunião, ela será encerrada automaticamente.";
      if (meetingId) {
        const data = JSON.stringify({ meetingId });
        navigator.sendBeacon('/api/update-status-on-exit', data);
      }
      // Padrão para a maioria dos navegadores.
      // Note que a mensagem personalizada pode não ser exibida.
      event.returnValue = confirmationMessage; 
      return confirmationMessage; // Para navegadores mais antigos.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [meetingId]);

  useEffect(() => {
    if (!userName) {
      router.push(`/${meetingId}`)
      return
    }

    const fetchMeetingData = async () => {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        console.error("Supabase client not available")
        setIsLoading(false)
        router.push("/meeting-not-found")
        return
      }

      try {
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_id", meetingId)
          .single()

        if (error || !data) {
          console.error("Error fetching meeting data or data not found:", error)
          router.push("/meeting-not-found")
          return
        }
        
        if (data.status === "ended") {
          router.push(`/${meetingId}?error=ended`)
          return
        }
        
        setMeetingData(data as unknown as Meeting)

        // Mark the meeting as watching
        if (data.status === "active") {
            const { error: updateError } = await supabase.from("meetings").update({ status: "watching" }).eq("meeting_id", meetingId)
            if (updateError) {
                console.error("Error updating meeting status to watching:", updateError)
                // Opcional: lidar com o erro, talvez com um toast
            }
        }
        
      } catch (error) {
        console.error("Exception fetching data:", error)
        router.push("/meeting-not-found")
      } finally {
        // Simulate loading for 5 seconds to show the loading screen
        setTimeout(() => {
          setIsLoading(false)
        }, 5000)
      }
    }

    fetchMeetingData()
  }, [userName, meetingId, router])

  if (isLoading || !meetingData) {
    return <LoadingScreen userName={userName || ""} />
  }

  return (
    <MeetingRoom
      meetingId={meetingId}
      userName={userName || ""}
      divId={meetingData.div_id}
      thumbId={meetingData.thumb_id}
      imageUrl={meetingData.src_images_url}
      scriptUrl={meetingData.src_scripts_url}
      initialPosition={lastPosition}
    />
  )
}
