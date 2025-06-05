"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import MeetingRoom from "@/components/meeting-room"
import LoadingScreen from "@/components/loading-screen"
import { getSupabaseBrowser } from "@/lib/supabase"

export default function RoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get("name")
  const videoUrl = searchParams.get("videoUrl")
  const [isLoading, setIsLoading] = useState(true)
  const [lastPosition, setLastPosition] = useState(0)

  useEffect(() => {
    if (!userName || !videoUrl) {
      router.push(`/${meetingId}`)
      return
    }

    // Fetch last video position for this user and check meeting status
    const fetchLastPosition = async () => {
      const supabase = getSupabaseBrowser()

      if (supabase) {
        try {
          // Check if meeting is still active
          const { data: meeting } = await supabase
            .from("meetings")
            .select("status")
            .eq("meeting_id", meetingId)
            .single()

          if (meeting && meeting.status === "ended") {
            // If meeting is ended, redirect to meeting page
            router.push(`/${meetingId}`)
            return
          }

          // Mark the meeting as ended as soon as the user joins the room
          const { error: updateError } = await supabase.from("meetings").update({ status: "ended" }).eq("meeting_id", meetingId)
          if (updateError) {
            console.error("Error updating meeting status:", updateError)
            // Handle error appropriately
          }

          // Get last video position
          // const { data } = await supabase
          //   .from("participants")
          //   .select("last_video_position")
          //   .eq("meeting_id", meetingId)
          //   .eq("name", userName)
          //   .single()

          // if (data && typeof data.last_video_position === 'number') {
          //   setLastPosition(data.last_video_position)
          // }
        } catch (error) {
          console.error("Error fetching data:", error)
        }
      }

      // Simulate loading for 5 seconds
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    }

    fetchLastPosition()
  }, [userName, videoUrl, meetingId])

  if (isLoading) {
    return <LoadingScreen userName={userName || ""} />
  }

  return (
    <MeetingRoom
      meetingId={meetingId}
      userName={userName || ""}
      videoUrl={videoUrl || ""}
      initialPosition={lastPosition}
    />
  )
}
