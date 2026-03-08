"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trash2, Play } from "lucide-react"
import { derivePlaylistTags } from "@/lib/search-tags"
import type { LibraryPlaylist } from "@/lib/types"

interface PlaylistCardProps {
  playlist: LibraryPlaylist
  onRemove?: (id: string) => void
}

export function PlaylistCard({ playlist, onRemove }: PlaylistCardProps) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const completedCount = playlist.completedVideoIds.length
  const progress = playlist.totalVideos > 0 ? Math.round((completedCount / playlist.totalVideos) * 100) : 0
  const tags = (playlist.tags?.length ? playlist.tags : derivePlaylistTags(playlist)).slice(0, 3)

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video bg-muted">
        {playlist.thumbnailUrl && !thumbnailFailed ? (
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Play className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {onRemove ? (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              onRemove(playlist.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <CardContent className="p-4">
        <Link href={`/watch/${playlist.id}`} className="hover:underline">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-3">
          {playlist.channelTitle} &middot; {playlist.totalVideos} videos &middot; {playlist.totalDuration}
        </p>
        {tags.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={`${playlist.id}-${tag}`}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {completedCount}/{playlist.totalVideos} completed
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Link href={`/watch/${playlist.id}`}>
          <Button variant="secondary" size="sm" className="w-full mt-3">
            {completedCount > 0 ? "Continue" : "Start Learning"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
