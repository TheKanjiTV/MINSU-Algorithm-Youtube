"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Search, FileText, ListVideo } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NoteFile } from "@/lib/types"

interface NotesSidebarProps {
  notes: NoteFile[]
  activeNoteId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

export function NotesSidebar({ notes, activeNoteId, onSelect, onCreate }: NotesSidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-3 border-b space-y-2">
        <Button onClick={onCreate} className="w-full gap-2" size="sm">
          <PlusCircle className="h-4 w-4" />
          New Note
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No notes found</p>
          )}
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelect(note.id)}
              className={cn(
                "p-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                activeNoteId === note.id && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium truncate">{note.title || "Untitled"}</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 pl-5.5">
                {note.content.slice(0, 60) || "Empty note"}
              </p>
              {note.playlistId && (
                <div className="flex items-center gap-1 pl-5.5 mt-0.5">
                  <ListVideo className="h-2.5 w-2.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Linked to playlist</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground pl-5.5 mt-0.5">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
