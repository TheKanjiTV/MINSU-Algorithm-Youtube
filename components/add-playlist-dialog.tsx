"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Loader2 } from "lucide-react"
import { extractPlaylistId, fetchPlaylistDetails } from "@/lib/youtube"
import { addPlaylist } from "@/lib/storage"
import type { LibraryPlaylist } from "@/lib/types"

interface AddPlaylistDialogProps {
  onAdded: () => void
}

export function AddPlaylistDialog({ onAdded }: AddPlaylistDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

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
      }
      addPlaylist(playlist)
      setUrl("")
      setOpen(false)
      onAdded()
    } catch {
      setError("Failed to fetch playlist. Check the URL and try again.")
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
          <Input
            placeholder="Paste YouTube playlist URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !url.trim()} className="w-full">
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
