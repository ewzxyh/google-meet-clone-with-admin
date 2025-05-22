"use client"

import { useEffect, useRef, useState } from "react"

interface VideoPlayerProps {
  videoUrl: string
  initialPosition: number
  onVideoEnd: () => void
  onTimeUpdate?: (time: number) => void
}

export default function VideoPlayer({ videoUrl, initialPosition, onVideoEnd, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false)
  const [youtubeId, setYoutubeId] = useState("")
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  useEffect(() => {
    // Check if the URL is a YouTube URL
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = videoUrl.match(youtubeRegex)

    if (match && match[1]) {
      setIsYouTubeVideo(true)
      setYoutubeId(match[1])
    } else {
      setIsYouTubeVideo(false)

      // Handle direct video file
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.currentTime = initialPosition

        const handleEnded = () => {
          onVideoEnd()
        }

        const handleTimeUpdate = () => {
          if (onTimeUpdate && videoElement) {
            onTimeUpdate(videoElement.currentTime)
          }
        }

        videoElement.addEventListener("ended", handleEnded)
        videoElement.addEventListener("timeupdate", handleTimeUpdate)

        return () => {
          videoElement.removeEventListener("ended", handleEnded)
          videoElement.removeEventListener("timeupdate", handleTimeUpdate)
        }
      }
    }
  }, [videoUrl, initialPosition, onVideoEnd, onTimeUpdate])

  // For YouTube videos, we need to use the YouTube IFrame API
  useEffect(() => {
    if (!isYouTubeVideo || !youtubeId) return

    // Only load the API once
    if (!(window as any).YT) {
      // Create a global callback that will be called when the API is ready
      ;(window as any).onYouTubeIframeAPIReady = () => {
        setIsPlayerReady(true)
      }

      // Load YouTube IFrame API
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    } else {
      // API already loaded
      setIsPlayerReady(true)
    }

    return () => {
      // Clean up player on unmount
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [isYouTubeVideo, youtubeId])

  // Initialize YouTube player when API is ready
  useEffect(() => {
    if (!isPlayerReady || !isYouTubeVideo || !youtubeId) return

    // Create the player
    playerRef.current = new (window as any).YT.Player(`youtube-player-${youtubeId}`, {
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(initialPosition),
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo()
        },
        onStateChange: (event: any) => {
          // YouTube state 0 means video ended
          if (event.data === 0) {
            onVideoEnd()
          }

          // Update time - verificando se o método existe antes de chamá-lo
          if (onTimeUpdate && playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
            try {
              const currentTime = playerRef.current.getCurrentTime()
              if (currentTime !== undefined) {
                onTimeUpdate(currentTime)
              }
            } catch (error) {
              console.error("Error getting current time:", error)
            }
          }
        },
      },
    })

    // Set up interval to update time
    if (onTimeUpdate) {
      const timeUpdateInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          const currentTime = playerRef.current.getCurrentTime()
          if (currentTime) {
            onTimeUpdate(currentTime)
          }
        }
      }, 1000)

      return () => clearInterval(timeUpdateInterval)
    }
  }, [isPlayerReady, isYouTubeVideo, youtubeId, initialPosition, onVideoEnd, onTimeUpdate])

  return (
    <div className="relative h-full w-full">
      {isYouTubeVideo ? (
        <div className="h-full w-full">
          {/* This div will be replaced by the YouTube player */}
          <div id={`youtube-player-${youtubeId}`} className="h-full w-full"></div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={videoUrl}
          autoPlay
          playsInline
          muted={false}
        />
      )}
    </div>
  )
}
