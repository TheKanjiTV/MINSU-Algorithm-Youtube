"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player"
import { WatchSidebar } from "@/components/watch-sidebar"
import { WatchNotes } from "@/components/watch-notes"
import { PlaylistQuiz } from "@/components/playlist-quiz"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  addPlaylist,
  getPlaylist,
  toggleVideoComplete,
  toggleVideoSkip,
  setLastWatched,
  getSettings,
  updateSettings,
  getVideoPosition,
  saveVideoPosition,
  clearVideoPosition,
  getEffectiveCounts,
} from "@/lib/storage"
import type { LibraryPlaylist } from "@/lib/types"
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRight,
  ListVideo,
  StickyNote,
} from "lucide-react"

const SPEED_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"]
const ALLOWED_SEEK_SECONDS = 10

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const playlistId = params.playlistId as string
  const teamId = searchParams.get("teamId")?.trim() || ""
  const playerRef = useRef<YouTubePlayerHandle>(null)
  const watchValidationRef = useRef({
    videoId: "",
    lastTime: 0,
    initialized: false,
    invalidSkip: false,
  })
  const serverSyncRef = useRef({ lastSentSecond: 0, lastSentAtMs: 0 })
  const recentlyEndedRef = useRef<{ videoId: string; untilMs: number }>({ videoId: "", untilMs: 0 })

  const [playlist, setPlaylist] = useState<LibraryPlaylist | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string>("")
  const [startAt, setStartAt] = useState<number>(0)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [canManualComplete, setCanManualComplete] = useState(false)
  const [manualCompleteMessage, setManualCompleteMessage] = useState("Videos auto-complete after valid full watch.")
  const role = session?.user?.role
  const isProfessor = role === "professor"
  const isAdmin = role === "admin"
  const isStudent = !isProfessor && !isAdmin

  // Load playlist
  useEffect(() => {
    let active = true
    const load = async () => {
      let data = getPlaylist(playlistId)
      if (!data) {
        try {
          const response = await fetch(`/api/course-playlists?id=${encodeURIComponent(playlistId)}`, {
            cache: "no-store",
          })
          const payload = await response.json()
          const global = Array.isArray(payload?.playlists) ? payload.playlists[0] : null
          if (global && active) {
            addPlaylist({
              ...global,
              completedVideoIds: [],
              skippedVideoIds: [],
            })
            data = getPlaylist(playlistId)
          }
        } catch {
          // ignore and fallback to redirect
        }
      }

      if (!data) {
        router.push("/library")
        return
      }

      if (!active) return
      setPlaylist(data)

      const startVideo = data.lastVideoId || data.videos[0]?.id
      if (startVideo) {
        setCurrentVideoId(startVideo)
        setStartAt(getVideoPosition(startVideo))
      }

      const settings = getSettings()
      setPlaybackSpeed(settings.playbackSpeed)
    }

    void load()
    return () => {
      active = false
    }
  }, [playlistId, router])

  useEffect(() => {
    if (!currentVideoId || !isStudent) return
    const start = getVideoPosition(currentVideoId)
    const duration = playerRef.current?.getDuration() || 0
    void fetch("/api/watch/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlistId,
        videoId: currentVideoId,
        event: "reset",
        currentTime: start,
        duration,
        playbackSpeed,
      }),
    }).catch(() => null)
  }, [currentVideoId, isStudent, playbackSpeed, playlistId])

  useEffect(() => {
    let active = true
    const resolveManualPermission = async () => {
      if (isAdmin) {
        if (!active) return
        setCanManualComplete(true)
        setManualCompleteMessage("")
        return
      }

      if (!isProfessor) {
        if (!active) return
        setCanManualComplete(false)
        setManualCompleteMessage("Videos auto-complete after valid full watch.")
        return
      }

      if (!teamId) {
        if (!active) return
        setCanManualComplete(false)
        setManualCompleteMessage("Professor mode: manual checking is only allowed inside your team playlist.")
        return
      }

      try {
        const response = await fetch(`/api/teams/${encodeURIComponent(teamId)}/assessment`, {
          cache: "no-store",
        })
        if (!active) return
        if (!response.ok) {
          setCanManualComplete(false)
          setManualCompleteMessage("Professor mode: you can only check videos in your own team playlist.")
          return
        }
        const data = await response.json()
        const teamPlaylistId = data?.team?.playlistId
        const teamProfessorId = data?.team?.professorId
        const allowed = Boolean(
          teamPlaylistId &&
            teamPlaylistId === playlistId &&
            (!session?.user?.id || !teamProfessorId || teamProfessorId === session.user.id)
        )
        setCanManualComplete(allowed)
        setManualCompleteMessage(
          allowed
            ? ""
            : "Professor mode: manual checking is only allowed for the assigned team playlist."
        )
      } catch {
        if (!active) return
        setCanManualComplete(false)
        setManualCompleteMessage("Professor mode: unable to verify team access for manual checking.")
      }
    }

    void resolveManualPermission()
    return () => {
      active = false
    }
  }, [isAdmin, isProfessor, playlistId, session?.user?.id, teamId])

  function refreshPlaylist() {
    const data = getPlaylist(playlistId)
    if (data) setPlaylist(data)
  }

  // Find next non-skipped video
  function findNextPlayable(fromIndex: number, direction: 1 | -1): number {
    if (!playlist) return -1
    const skipped = new Set(playlist.skippedVideoIds || [])
    let i = fromIndex + direction
    while (i >= 0 && i < playlist.videos.length) {
      if (!skipped.has(playlist.videos[i].id)) return i
      i += direction
    }
    return -1
  }

  const currentIndex = playlist?.videos.findIndex((v) => v.id === currentVideoId) ?? -1

  const goNext = useCallback(() => {
    if (!playlist) return
    const nextIdx = findNextPlayable(currentIndex, 1)
    if (nextIdx === -1) return
    const nextVideo = playlist.videos[nextIdx]
    const pos = getVideoPosition(nextVideo.id)
    setCurrentVideoId(nextVideo.id)
    setStartAt(pos)
    setLastWatched(playlistId, nextVideo.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, currentIndex, playlistId])

  const goPrev = useCallback(() => {
    if (!playlist) return
    const prevIdx = findNextPlayable(currentIndex, -1)
    if (prevIdx === -1) return
    const prevVideo = playlist.videos[prevIdx]
    const pos = getVideoPosition(prevVideo.id)
    setCurrentVideoId(prevVideo.id)
    setStartAt(pos)
    setLastWatched(playlistId, prevVideo.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, currentIndex, playlistId])

  const toggleFocus = useCallback(() => {
    setFocusMode((prev) => !prev)
  }, [])

  useKeyboardShortcuts({ onNext: goNext, onPrev: goPrev, onToggleFocus: toggleFocus })

  function handleSelectVideo(videoId: string) {
    const pos = getVideoPosition(videoId)
    setCurrentVideoId(videoId)
    setStartAt(pos)
    setLastWatched(playlistId, videoId)
    watchValidationRef.current = {
      videoId,
      lastTime: pos,
      initialized: false,
      invalidSkip: false,
    }
    serverSyncRef.current = { lastSentSecond: 0, lastSentAtMs: 0 }
  }

  function handleToggleComplete(videoId: string) {
    if (!canManualComplete) return
    toggleVideoComplete(playlistId, videoId)
    refreshPlaylist()
  }

  function handleToggleSkip(videoId: string) {
    toggleVideoSkip(playlistId, videoId)
    refreshPlaylist()
  }

  function handleVideoEnded() {
    // Prevent late ENDED/Pause callbacks from restoring near-end saved position.
    recentlyEndedRef.current = { videoId: currentVideoId, untilMs: Date.now() + 2500 }
    // Clear saved position for completed video
    clearVideoPosition(currentVideoId)

    const finalizeCompletion = async () => {
      const currentTime = playerRef.current?.getCurrentTime() || 0
      const duration = playerRef.current?.getDuration() || 0
      let canComplete = canManualComplete
      if (isStudent) {
        try {
          const response = await fetch("/api/watch/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playlistId,
              videoId: currentVideoId,
              event: "ended",
              currentTime,
              duration,
              playbackSpeed,
            }),
          })
          const data = await response.json()
          if (response.ok) {
            canComplete = Boolean(data.canComplete)
          }
        } catch {
          // fallback to local validation only
        }
      }

      if (playlist && !playlist.completedVideoIds.includes(currentVideoId) && canComplete) {
        toggleVideoComplete(playlistId, currentVideoId)
        refreshPlaylist()
      }
    }

    void finalizeCompletion()

    const settings = getSettings()
    if (settings.autoAdvance) {
      goNext()
    }
  }

  function handleTimeUpdate(seconds: number) {
    const recentlyEnded = recentlyEndedRef.current
    if (recentlyEnded.videoId === currentVideoId && Date.now() < recentlyEnded.untilMs) {
      return
    }
    saveVideoPosition(currentVideoId, seconds)
    if (!isStudent || !currentVideoId) return

    const state = watchValidationRef.current
    if (state.videoId !== currentVideoId) {
      watchValidationRef.current = {
        videoId: currentVideoId,
        lastTime: seconds,
        initialized: true,
        invalidSkip: false,
      }
      return
    }

    if (!state.initialized) {
      state.lastTime = seconds
      state.initialized = true
      return
    }

    const delta = seconds - state.lastTime
    // Student completion requires near-real-time watching. Small jumps up to 10s are allowed.
    if (delta > ALLOWED_SEEK_SECONDS + 1.5 * playbackSpeed) {
      state.invalidSkip = true
    }
    state.lastTime = seconds

    const now = Date.now()
    const safeSecond = Math.floor(seconds)
    if (
      safeSecond - serverSyncRef.current.lastSentSecond >= 3 ||
      now - serverSyncRef.current.lastSentAtMs >= 4000
    ) {
      serverSyncRef.current = { lastSentSecond: safeSecond, lastSentAtMs: now }
      const duration = playerRef.current?.getDuration() || 0
      void fetch("/api/watch/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          videoId: currentVideoId,
          event: "progress",
          currentTime: seconds,
          duration,
          playbackSpeed,
        }),
      }).catch(() => null)
    }
  }

  function handleSpeedChange(value: string) {
    const speed = parseFloat(value)
    setPlaybackSpeed(speed)
    updateSettings({ playbackSpeed: speed })
  }

  // Player ref callbacks for notes
  const getPlayerTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() || 0
  }, [])

  const seekPlayerTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds)
  }, [])

  useEffect(() => {
    if (!playlist) return
    const { totalActive, completedActive } = getEffectiveCounts(playlist)
    const isCompleted = totalActive > 0 && completedActive >= totalActive
    if (!isCompleted) {
      setShowQuiz(false)
      setQuizSubmitted(false)
    }
  }, [playlist, playlistId])

  if (!playlist) return null

  const currentVideo = playlist.videos.find((v) => v.id === currentVideoId)
  const hasNext = findNextPlayable(currentIndex, 1) !== -1
  const hasPrev = findNextPlayable(currentIndex, -1) !== -1
  const { totalActive, completedActive } = getEffectiveCounts(playlist)
  const isPlaylistCompleted = totalActive > 0 && completedActive >= totalActive

  return (
    <div
      className={`flex flex-col lg:flex-row h-[calc(100vh-7rem)] ${focusMode ? "fixed inset-0 z-50 bg-background h-screen" : ""}`}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Player */}
        <div className="w-full">
          {currentVideoId ? (
            <YouTubePlayer
              ref={playerRef}
              videoId={currentVideoId}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              playbackSpeed={playbackSpeed}
              startAt={startAt}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
              No video available in this playlist yet.
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between p-3 border-b gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={!hasPrev}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={!hasNext}>
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEED_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFocus}>
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Video title */}
        {currentVideo && (
          <div className="p-4">
            <h1 className="text-lg font-semibold">{currentVideo.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Video {currentVideo.position} of {playlist.totalVideos} &middot; {playlist.channelTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">N</kbd> Next{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">P</kbd> Previous{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">F</kbd> Focus mode
            </p>
          </div>
        )}
        <PlaylistQuiz
          playlistId={playlist.id}
          playlistTitle={playlist.title}
          videos={playlist.videos.map((video) => ({ id: video.id, title: video.title }))}
          visible={isPlaylistCompleted && showQuiz}
          onVisibilityChange={(open) => setShowQuiz(open)}
          onQuizSubmitted={() => setQuizSubmitted(true)}
        />
      </div>

      {/* Sidebar with tabs */}
      {sidebarOpen && (
        <div className="w-full lg:w-80 xl:w-96 h-64 lg:h-full border-t lg:border-t-0 flex flex-col">
          <Tabs defaultValue="playlist" className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b bg-background h-9 shrink-0">
              <TabsTrigger value="playlist" className="flex-1 gap-1.5 text-xs">
                <ListVideo className="h-3.5 w-3.5" />
                Playlist
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
                <StickyNote className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="playlist" className="flex-1 mt-0 overflow-hidden">
              <WatchSidebar
                playlist={playlist}
                currentVideoId={currentVideoId}
                onSelectVideo={handleSelectVideo}
                onToggleComplete={handleToggleComplete}
                onToggleSkip={handleToggleSkip}
                canManualComplete={canManualComplete}
                manualCompleteMessage={manualCompleteMessage}
                showStartQuiz={isPlaylistCompleted}
                onStartQuiz={() => {
                  setShowQuiz(true)
                  if (!quizSubmitted) {
                    setTimeout(() => {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                    }, 120)
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="notes" className="flex-1 mt-0 overflow-hidden">
              <WatchNotes
                playlistId={playlistId}
                playlistTitle={playlist.title}
                getCurrentTime={getPlayerTime}
                onSeekTo={seekPlayerTo}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
