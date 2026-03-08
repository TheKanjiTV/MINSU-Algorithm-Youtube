"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlaylistCard } from "@/components/playlist-card"
import { getImportedCoursePlaylists } from "@/lib/storage"
import { derivePlaylistTags, searchPlaylistScore } from "@/lib/search-tags"
import type { LibraryPlaylist } from "@/lib/types"
import { ArrowLeft, Search } from "lucide-react"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function mergePlaylists(globalPlaylists: LibraryPlaylist[], localPlaylists: LibraryPlaylist[]) {
  const merged = [...globalPlaylists, ...localPlaylists].map((playlist) => ({
    ...playlist,
    tags: playlist.tags?.length ? playlist.tags : derivePlaylistTags(playlist),
  }))

  const seen = new Set<string>()
  return merged.filter((playlist) => {
    if (seen.has(playlist.id)) return false
    seen.add(playlist.id)
    return true
  })
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [allPlaylists, setAllPlaylists] = useState<LibraryPlaylist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncQuery = () => {
      const params = new URLSearchParams(window.location.search)
      setQuery((params.get("q") || "").trim())
    }
    syncQuery()
    window.addEventListener("popstate", syncQuery)

    let mounted = true

    async function loadPlaylists() {
      try {
        const local = getImportedCoursePlaylists()
        const response = await fetch("/api/course-playlists", { cache: "no-store" })
        const data = await response.json()
        const global = Array.isArray(data.playlists) ? (data.playlists as LibraryPlaylist[]) : []
        if (!mounted) return
        setAllPlaylists(mergePlaylists(global, local))
      } catch {
        if (!mounted) return
        setAllPlaylists(mergePlaylists([], getImportedCoursePlaylists()))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadPlaylists()
    const onStorage = () => void loadPlaylists()
    window.addEventListener("ytlearn:storage", onStorage as EventListener)
    return () => {
      mounted = false
      window.removeEventListener("popstate", syncQuery)
      window.removeEventListener("ytlearn:storage", onStorage as EventListener)
    }
  }, [])

  const results = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return []
    return allPlaylists
      .map((playlist) => ({ playlist, score: searchPlaylistScore(playlist, normalized) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.playlist)
  }, [allPlaylists, query])

  return (
    <div className="container px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Search Results</h1>
          <p className="text-sm text-muted-foreground">
            {query ? `Results for "${query}"` : "Search from homepage to view cards here."}
          </p>
        </div>
        <Link href="/homepage">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Button>
        </Link>
      </div>

      {!query ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Search className="mx-auto mb-2 h-6 w-6" />
          Search is available after you search from the homepage.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Loading search results...
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Search className="mx-auto mb-2 h-6 w-6" />
          No cards matched "{query}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  )
}
