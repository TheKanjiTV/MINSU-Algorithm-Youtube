"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimeRemaining, getEffectiveCounts } from "@/lib/storage"
import type { LibraryVideo, LibraryPlaylist } from "@/lib/types"

interface WatchSidebarProps {
  playlist: LibraryPlaylist
  currentVideoId: string
  onSelectVideo: (videoId: string) => void
  onToggleComplete: (videoId: string) => void
  onToggleSkip: (videoId: string) => void
  canManualComplete: boolean
  manualCompleteMessage?: string
  showStartQuiz: boolean
  onStartQuiz: () => void
}

export function WatchSidebar({
  playlist,
  currentVideoId,
  onSelectVideo,
  onToggleComplete,
  onToggleSkip,
  canManualComplete,
  manualCompleteMessage,
  showStartQuiz,
  onStartQuiz,
}: WatchSidebarProps) {
  const [search, setSearch] = useState("")

  const skippedIds = new Set(playlist.skippedVideoIds || [])
  const completedIds = new Set(playlist.completedVideoIds)
  const { totalActive, completedActive, progress } = getEffectiveCounts(playlist)
  const timeLeft = getTimeRemaining(playlist)

  const filtered = playlist.videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {completedActive}/{totalActive} completed
          </span>
          <span className="text-muted-foreground text-xs">{timeLeft}</span>
        </div>
        {!canManualComplete ? (
          <p className="text-[11px] text-muted-foreground">
            {manualCompleteMessage || "Videos auto-complete after valid full watch."}
          </p>
        ) : null}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {showStartQuiz ? (
          <Button type="button" size="sm" className="w-full" onClick={onStartQuiz}>
            Start Quiz
          </Button>
        ) : null}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Video list */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filtered.map((video) => {
            const isActive = video.id === currentVideoId
            const isCompleted = completedIds.has(video.id)
            const isSkipped = skippedIds.has(video.id)

            return (
              <div
                key={video.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
                  isActive && "bg-accent",
                  isSkipped && "opacity-40"
                )}
                onClick={() => !isSkipped && onSelectVideo(video.id)}
              >
                {!isSkipped ? (
                  <Checkbox
                    checked={isCompleted}
                    disabled={!canManualComplete}
                    onCheckedChange={() => {
                      if (!canManualComplete) return
                      onToggleComplete(video.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <SkipForward className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm line-clamp-2",
                      (isCompleted || isSkipped) && "text-muted-foreground line-through"
                    )}
                  >
                    {video.position}. {video.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{video.duration}</span>
                    {isSkipped && <span className="text-[10px] text-muted-foreground">Skipped</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isSkipped && "opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSkip(video.id)
                  }}
                  title={isSkipped ? "Unskip video" : "Skip (irrelevant)"}
                >
                  <SkipForward className={cn("h-3 w-3", isSkipped ? "text-foreground" : "text-muted-foreground")} />
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
