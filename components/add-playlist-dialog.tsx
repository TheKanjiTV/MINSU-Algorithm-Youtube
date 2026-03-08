"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Loader2 } from "lucide-react"
import { extractPlaylistId, fetchPlaylistDetails } from "@/lib/youtube"
import { addPlaylist } from "@/lib/storage"
import { COURSE_CATEGORIES } from "@/lib/course-references"
import { derivePlaylistTags } from "@/lib/search-tags"
import type { LibraryPlaylist } from "@/lib/types"

interface AddPlaylistDialogProps {
  onAdded: () => void
  defaultCategorySlug?: string
  defaultTopicSlug?: string
}

export function AddPlaylistDialog({
  onAdded,
  defaultCategorySlug,
  defaultTopicSlug,
}: AddPlaylistDialogProps) {
  const initialCategory = defaultCategorySlug ?? COURSE_CATEGORIES[0]?.slug ?? ""
  const initialTopic =
    defaultTopicSlug ??
    COURSE_CATEGORIES.find((category) => category.slug === initialCategory)?.topics[0]?.slug ??
    ""

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [categorySlug, setCategorySlug] = useState(initialCategory)
  const [topicSlug, setTopicSlug] = useState(initialTopic)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedCategory = useMemo(
    () => COURSE_CATEGORIES.find((category) => category.slug === categorySlug) ?? null,
    [categorySlug]
  )
  const selectedTopic = useMemo(
    () => selectedCategory?.topics.find((topic) => topic.slug === topicSlug) ?? null,
    [selectedCategory, topicSlug]
  )

  function handleCategoryChange(nextCategorySlug: string) {
    setCategorySlug(nextCategorySlug)
    const nextCategory = COURSE_CATEGORIES.find((category) => category.slug === nextCategorySlug)
    setTopicSlug(nextCategory?.topics[0]?.slug ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!selectedCategory || !selectedTopic) {
      setError("Please select a course category and topic.")
      return
    }

    const playlistId = extractPlaylistId(url)
    if (!playlistId) {
      setError("Invalid YouTube playlist URL. Please paste a valid URL.")
      return
    }

    setLoading(true)
    try {
      const data = await fetchPlaylistDetails(playlistId)
      const playlist: LibraryPlaylist = {
        ...data,
        addedAt: new Date().toISOString(),
        completedVideoIds: [],
        courseCategorySlug: selectedCategory.slug,
        courseCategoryLabel: selectedCategory.label,
        courseTopicSlug: selectedTopic.slug,
        courseTopicLabel: selectedTopic.label,
      }
      playlist.tags = derivePlaylistTags(playlist)
      addPlaylist(playlist)
      await fetch("/api/course-playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playlist),
      }).catch(() => null)
      setUrl("")
      setOpen(false)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch playlist. Check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add YouTube Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <Select value={categorySlug} onValueChange={handleCategoryChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Topic</p>
              <Select value={topicSlug} onValueChange={setTopicSlug} disabled={loading || !selectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.topics.map((topic) => (
                    <SelectItem key={`${selectedCategory.slug}-${topic.slug}`} value={topic.slug}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            placeholder="Paste YouTube playlist URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !url.trim() || !selectedCategory || !selectedTopic}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Playlist"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
