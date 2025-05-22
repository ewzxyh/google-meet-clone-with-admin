// Helper functions to manage meeting state in localStorage

export function markMeetingAsEnded(meetingId: string): void {
  if (typeof window !== "undefined") {
    const endedMeetings = getEndedMeetings()
    endedMeetings.push(meetingId)
    localStorage.setItem("endedMeetings", JSON.stringify(endedMeetings))
  }
}

export function isMeetingEnded(meetingId: string): boolean {
  if (typeof window !== "undefined") {
    const endedMeetings = getEndedMeetings()
    return endedMeetings.includes(meetingId)
  }
  return false
}

function getEndedMeetings(): string[] {
  if (typeof window !== "undefined") {
    const storedMeetings = localStorage.getItem("endedMeetings")
    return storedMeetings ? JSON.parse(storedMeetings) : []
  }
  return []
}
