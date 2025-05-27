import { supabaseServer, mockMeetingData } from "@/lib/supabase"
import JoinMeeting from "@/components/join-meeting"
import MeetingEnded from "@/components/meeting-ended"
import { redirect } from "next/navigation"

export default async function MeetingPage({ params }: { params: Promise<{ meetingId: string }> }) {
  // Await params before using them
  const { meetingId } = await params

  // Special case for admin route
  if (meetingId === "admin") {
    redirect("/admin")
    return null
  }

  // If Supabase is not available, use mock data for development
  if (!supabaseServer) {
    console.warn("Supabase client not initialized. Using mock data.")
    return <JoinMeeting meetingId={meetingId} videoUrl={mockMeetingData.video_url} />
  }

  try {
    // Check if meeting exists
    const { data: meetings, error } = await supabaseServer
      .from("meetings")
      .select("meeting_id, status, video_url, created_at")
      .eq("meeting_id", meetingId)

    if (error) {
      console.error("Error fetching meetings:", error)
      return (
        <JoinMeeting
          meetingId={meetingId}
          videoUrl="https://mhvzjal0ig61abwu.public.blob.vercel-storage.com/Amanda-QQLE8o1Zw9BaYtLwXmBoIBUToihnWY.mp4"
        />
      )
    }

    // If no meeting found
    if (!meetings || meetings.length === 0) {
      console.log("No meeting found with ID:", meetingId)
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold">Reunião não encontrada</h1>
            <p className="mb-8 text-gray-600">A reunião que você está tentando acessar não existe.</p>
            <a href="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Voltar para a página inicial
            </a>
          </div>
        </div>
      )
    }

    const meeting = meetings[0]

    // If meeting is ended, show the meeting ended page
    if (meeting.status === "ended") {
      return <MeetingEnded meetingId={meetingId} />
    }

    // If meeting is active, show the join meeting page
    return <JoinMeeting meetingId={meetingId} videoUrl={meeting.video_url} />
  } catch (error) {
    console.error("Error in meeting page:", error)
    // Provide a fallback experience instead of redirecting
    return (
      <JoinMeeting
        meetingId={meetingId}
        videoUrl="https://mhvzjal0ig61abwu.public.blob.vercel-storage.com/Amanda-QQLE8o1Zw9BaYtLwXmBoIBUToihnWY.mp4"
      />
    )
  }
}
