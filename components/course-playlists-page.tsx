"use client"

import { useEffect, useMemo, useState } from "react"
import { AddPlaylistDialog } from "@/components/add-playlist-dialog"
import { EmptyState } from "@/components/empty-state"
import { PlaylistCard } from "@/components/playlist-card"
import { getCoursePlaylists } from "@/lib/storage"
import type { CourseCategoryReference, CourseTopicReference } from "@/lib/course-references"
import type { LibraryPlaylist } from "@/lib/types"
import { BookOpen } from "lucide-react"

type CoursePlaylistsPageProps = {
  category: CourseCategoryReference
  topic: CourseTopicReference
}

export function CoursePlaylistsPage({ category, topic }: CoursePlaylistsPageProps) {
  const [playlists, setPlaylists] = useState<LibraryPlaylist[]>([])

  const title = useMemo(() => `${topic.label} Courses`, [topic.label])

  async function refresh() {
    const local = getCoursePlaylists(category.slug, topic.slug)
    try {
      const params = new URLSearchParams({
        category: category.slug,
        topic: topic.slug,
      })
      const response = await fetch(`/api/course-playlists?${params.toString()}`, { cache: "no-store" })
      const data = await response.json()
      const global = Array.isArray(data.playlists) ? (data.playlists as LibraryPlaylist[]) : []
      const merged = [...global, ...local]
      const seen = new Set<string>()
      const deduped = merged.filter((playlist) => {
        if (seen.has(playlist.id)) return false
        seen.add(playlist.id)
        return true
      })
      setPlaylists(deduped)
    } catch {
      setPlaylists(local)
    }
  }

  useEffect(() => {
    void refresh()
    const onStorageChange = () => void refresh()
    window.addEventListener("ytlearn:storage", onStorageChange as EventListener)
    return () => window.removeEventListener("ytlearn:storage", onStorageChange as EventListener)
  }, [category.slug, topic.slug])

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Imported playlists for {category.label} / {topic.label}
          </p>
        </div>
        <AddPlaylistDialog
          onAdded={refresh}
          defaultCategorySlug={category.slug}
          defaultTopicSlug={topic.slug}
        />
      </div>

      {playlists.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`No playlists imported for ${topic.label} yet`}
          description="Import a YouTube playlist and assign it to this course topic."
        >
          <AddPlaylistDialog
            onAdded={refresh}
            defaultCategorySlug={category.slug}
            defaultTopicSlug={topic.slug}
          />
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  )
}
