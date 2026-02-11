"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"

export interface YouTubePlayerHandle {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
}

interface YouTubePlayerProps {
  videoId: string
  onEnded?: () => void
  onTimeUpdate?: (seconds: number) => void
  playbackSpeed: number
  startAt?: number // seconds to resume from
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, onEnded, onTimeUpdate, playbackSpeed, startAt }, ref) {
    const playerRef = useRef<YTPlayer | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const currentVideoId = useRef(videoId)
    const timeInterval = useRef<ReturnType<typeof setInterval> | null>(null)

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        try {
          return playerRef.current?.getCurrentTime() || 0
        } catch {
          return 0
        }
      },
      seekTo: (seconds: number) => {
        try {
          playerRef.current?.seekTo(seconds, true)
        } catch {
          // ignore
        }
      },
    }))

    // Periodic time reporting (for saving position)
    function startTimeTracking() {
      stopTimeTracking()
      timeInterval.current = setInterval(() => {
        if (playerRef.current) {
          try {
            const state = playerRef.current.getPlayerState()
            if (state === 1) {
              // PLAYING
              onTimeUpdate?.(playerRef.current.getCurrentTime())
            }
          } catch {
            // ignore
          }
        }
      }, 5000) // save every 5 seconds
    }

    function stopTimeTracking() {
      if (timeInterval.current) {
        clearInterval(timeInterval.current)
        timeInterval.current = null
      }
    }

    const initPlayer = useCallback(() => {
      if (!containerRef.current || !window.YT?.Player) return

      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: currentVideoId.current,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          playsinline: 1,
          start: startAt && startAt > 5 ? Math.floor(startAt) : undefined,
        },
        events: {
          onReady: (event) => {
            event.target.setPlaybackRate(playbackSpeed)
            startTimeTracking()
          },
          onStateChange: (event) => {
            if (event.data === 0) {
              onEnded?.()
            }
            if (event.data === 1) {
              startTimeTracking()
            }
            if (event.data === 2 || event.data === 0) {
              // PAUSED or ENDED - save position immediately
              try {
                onTimeUpdate?.(event.target.getCurrentTime())
              } catch {
                // ignore
              }
            }
          },
        },
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onEnded, playbackSpeed, startAt])

    // Load YouTube IFrame API
    useEffect(() => {
      if (window.YT?.Player) {
        initPlayer()
        return
      }

      const existing = document.getElementById("yt-iframe-api")
      if (!existing) {
        const script = document.createElement("script")
        script.id = "yt-iframe-api"
        script.src = "https://www.youtube.com/iframe_api"
        document.head.appendChild(script)
      }

      window.onYouTubeIframeAPIReady = () => {
        initPlayer()
      }

      return () => {
        stopTimeTracking()
        if (playerRef.current) {
          playerRef.current.destroy()
          playerRef.current = null
        }
      }
    }, [initPlayer])

    // Handle video change
    useEffect(() => {
      currentVideoId.current = videoId
      if (playerRef.current) {
        try {
          if (startAt && startAt > 5) {
            ;(playerRef.current as any).loadVideoById({ videoId, startSeconds: Math.floor(startAt) })
          } else {
            ;(playerRef.current as any).loadVideoById(videoId)
          }
          playerRef.current.setPlaybackRate(playbackSpeed)
        } catch {
          initPlayer()
        }
      }
    }, [videoId, initPlayer, playbackSpeed, startAt])

    // Handle playback speed change
    useEffect(() => {
      if (playerRef.current) {
        try {
          playerRef.current.setPlaybackRate(playbackSpeed)
        } catch {
          // ignore
        }
      }
    }, [playbackSpeed])

    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    )
  }
)
