"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlaylistCard } from "@/components/playlist-card"
import { AddPlaylistDialog } from "@/components/add-playlist-dialog"
import { EmptyState } from "@/components/empty-state"
import { getLibrary, removePlaylist, migrateFromOldStorage } from "@/lib/storage"
import type { LibraryPlaylist } from "@/lib/types"
import { Library, Search } from "lucide-react"

type SortOption = "recent" | "progress" | "added" | "name"

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<LibraryPlaylist[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("recent")

  async function refresh() {
    const local = getLibrary()
    try {
      const response = await fetch("/api/course-playlists", { cache: "no-store" })
      const data = await response.json()
      const global = Array.isArray(data.playlists) ? (data.playlists as LibraryPlaylist[]) : []
      const merged = [...local, ...global]
      const seen = new Set<string>()
      setPlaylists(
        merged.filter((playlist) => {
          if (!playlist?.id || seen.has(playlist.id)) return false
          seen.add(playlist.id)
          return true
        })
      )
    } catch {
      setPlaylists(local)
    }
  }

  useEffect(() => {
    migrateFromOldStorage()
    void refresh()
  }, [])

  function handleRemove(id: string) {
    removePlaylist(id)
    void refresh()
  }

  const filtered = useMemo(() => {
    let list = playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.channelTitle.toLowerCase().includes(search.toLowerCase())
    )

    switch (sort) {
      case "recent":
        list.sort((a, b) => (b.lastWatchedAt || b.addedAt).localeCompare(a.lastWatchedAt || a.addedAt))
        break
      case "progress":
        list.sort((a, b) => {
          const pa = a.totalVideos > 0 ? a.completedVideoIds.length / a.totalVideos : 0
          const pb = b.totalVideos > 0 ? b.completedVideoIds.length / b.totalVideos : 0
          return pb - pa
        })
        break
      case "added":
        list.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
        break
      case "name":
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return list
  }, [playlists, search, sort])

  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-6">
      <section className="rounded-2xl border bg-gradient-to-r from-sky-50 to-indigo-50 p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Saved playlists</p>
            <h1 className="text-2xl font-bold mt-1">Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your courses, track progress, and jump back in anytime.
            </p>
          </div>
          <AddPlaylistDialog onAdded={refresh} />
        </div>
      </section>

      {playlists.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Watched</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="added">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {playlists.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Your library is empty"
          description="Add a YouTube playlist URL to start learning distraction-free."
        >
          <AddPlaylistDialog onAdded={refresh} />
        </EmptyState>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No playlists match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}
