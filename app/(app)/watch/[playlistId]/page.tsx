"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player"
import { WatchSidebar } from "@/components/watch-sidebar"
import { WatchNotes } from "@/components/watch-notes"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  getPlaylist,
  toggleVideoComplete,
  toggleVideoSkip,
  setLastWatched,
  getSettings,
  updateSettings,
  getVideoPosition,
  saveVideoPosition,
  clearVideoPosition,
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

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.playlistId as string
  const playerRef = useRef<YouTubePlayerHandle>(null)

  const [playlist, setPlaylist] = useState<LibraryPlaylist | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string>("")
  const [startAt, setStartAt] = useState<number>(0)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Load playlist
  useEffect(() => {
    const data = getPlaylist(playlistId)
    if (!data) {
      router.push("/library")
      return
    }
    setPlaylist(data)

    const startVideo = data.lastVideoId || data.videos[0]?.id
    if (startVideo) {
      setCurrentVideoId(startVideo)
      setStartAt(getVideoPosition(startVideo))
    }

    const settings = getSettings()
    setPlaybackSpeed(settings.playbackSpeed)
  }, [playlistId, router])

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
  }

  function handleToggleComplete(videoId: string) {
    toggleVideoComplete(playlistId, videoId)
    refreshPlaylist()
  }

  function handleToggleSkip(videoId: string) {
    toggleVideoSkip(playlistId, videoId)
    refreshPlaylist()
  }

  function handleVideoEnded() {
    // Clear saved position for completed video
    clearVideoPosition(currentVideoId)

    if (playlist && !playlist.completedVideoIds.includes(currentVideoId)) {
      toggleVideoComplete(playlistId, currentVideoId)
      refreshPlaylist()
    }

    const settings = getSettings()
    if (settings.autoAdvance) {
      goNext()
    }
  }

  function handleTimeUpdate(seconds: number) {
    saveVideoPosition(currentVideoId, seconds)
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

  if (!playlist) return null

  const currentVideo = playlist.videos.find((v) => v.id === currentVideoId)
  const hasNext = findNextPlayable(currentIndex, 1) !== -1
  const hasPrev = findNextPlayable(currentIndex, -1) !== -1

  return (
    <div
      className={`flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] ${focusMode ? "fixed inset-0 z-50 bg-background h-screen" : ""}`}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Player */}
        <div className="w-full">
          <YouTubePlayer
            ref={playerRef}
            videoId={currentVideoId}
            onEnded={handleVideoEnded}
            onTimeUpdate={handleTimeUpdate}
            playbackSpeed={playbackSpeed}
            startAt={startAt}
          />
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
