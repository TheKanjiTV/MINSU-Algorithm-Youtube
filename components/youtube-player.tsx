"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"

export interface YouTubePlayerHandle {
  getCurrentTime: () => number
  getDuration: () => number
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
    const onEndedRef = useRef(onEnded)
    const onTimeUpdateRef = useRef(onTimeUpdate)
    const playbackSpeedRef = useRef(playbackSpeed)

    useEffect(() => {
      onEndedRef.current = onEnded
    }, [onEnded])

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate
    }, [onTimeUpdate])

    useEffect(() => {
      playbackSpeedRef.current = playbackSpeed
    }, [playbackSpeed])

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        try {
          return playerRef.current?.getCurrentTime() || 0
        } catch {
          return 0
        }
      },
      getDuration: () => {
        try {
          return playerRef.current?.getDuration() || 0
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
              onTimeUpdateRef.current?.(playerRef.current.getCurrentTime())
            }
          } catch {
            // ignore
          }
        }
      }, 1000) // report every 1 second for accurate watch validation
    }

    function stopTimeTracking() {
      if (timeInterval.current) {
        clearInterval(timeInterval.current)
        timeInterval.current = null
      }
    }

    const initPlayer = useCallback(() => {
      if (!containerRef.current || !window.YT?.Player) return

      if (playerRef.current) return

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
            event.target.setPlaybackRate(playbackSpeedRef.current)
            startTimeTracking()
          },
          onStateChange: (event) => {
            if (event.data === 0) {
              onEndedRef.current?.()
            }
            if (event.data === 1) {
              startTimeTracking()
            }
            if (event.data === 2 || event.data === 0) {
              // PAUSED or ENDED - save position immediately
              try {
                onTimeUpdateRef.current?.(event.target.getCurrentTime())
              } catch {
                // ignore
              }
            }
          },
        },
      })
    }, [])

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
          playerRef.current.setPlaybackRate(playbackSpeedRef.current)
        } catch {
          initPlayer()
        }
      }
    }, [videoId, initPlayer, startAt])

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
