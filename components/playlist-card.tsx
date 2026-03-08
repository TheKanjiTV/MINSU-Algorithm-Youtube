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
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-slate-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-video bg-slate-100">
        {playlist.thumbnailUrl && !thumbnailFailed ? (
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-200 to-slate-300">
            <Play className="h-10 w-10 text-slate-600" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {playlist.totalVideos} videos
        </div>
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
      <CardContent className="flex h-full flex-col p-4">
        <Link href={`/watch/${playlist.id}`} className="hover:underline">
          <h3 className="mb-1 line-clamp-2 min-h-[44px] text-[17px] font-bold leading-tight text-slate-900">{playlist.title}</h3>
        </Link>
        <p className="mb-3 min-h-[40px] line-clamp-2 text-sm text-slate-600">
          {playlist.channelTitle} &middot; {playlist.totalVideos} videos &middot; {playlist.totalDuration}
        </p>
        <div className="mb-3 min-h-[24px]">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={`${playlist.id}-${tag}`}
                  className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">
              {completedCount}/{playlist.totalVideos} completed
            </span>
            <span className="font-semibold text-slate-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Link href={`/watch/${playlist.id}`} className="mt-3">
          <Button variant="secondary" size="sm" className="w-full font-semibold">
            {completedCount > 0 ? "Continue" : "Start Learning"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
