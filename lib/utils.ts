import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateMeetingId(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  // Generate first segment (3 characters)
  for (let i = 0; i < 3; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  result += "-"

  // Generate second segment (3 characters)
  for (let i = 0; i < 3; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  result += "-"

  // Generate third segment (3 characters)
  for (let i = 0; i < 3; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return [
    hours > 0 ? hours.toString().padStart(2, "0") : null,
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(":")
}
