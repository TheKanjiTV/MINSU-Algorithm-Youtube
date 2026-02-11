"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/storage"
import type { NoteFile } from "@/lib/types"
import { PlusCircle, Trash2, ArrowLeft, FileText, Clock } from "lucide-react"

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface WatchNotesProps {
  playlistId: string
  playlistTitle: string
  getCurrentTime?: () => number
  onSeekTo?: (seconds: number) => void
}

export function WatchNotes({ playlistId, playlistTitle, getCurrentTime, onSeekTo }: WatchNotesProps) {
  const [notes, setNotes] = useState<NoteFile[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function refresh() {
    const all = getNotes().filter((n) => n.playlistId === playlistId)
    setNotes(all)
    return all
  }

  useEffect(() => {
    refresh()
  }, [playlistId])

  const activeNote = notes.find((n) => n.id === activeNoteId)

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
    }
  }, [activeNoteId, activeNote?.title, activeNote?.content])

  const save = useCallback(
    (newTitle: string, newContent: string) => {
      if (!activeNoteId) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(activeNoteId, { title: newTitle, content: newContent })
        refresh()
      }, 500)
    },
    [activeNoteId]
  )

  function handleCreate() {
    const note = createNote(`Note - ${playlistTitle}`, playlistId)
    refresh()
    setActiveNoteId(note.id)
  }

  function handleDelete(id: string) {
    deleteNote(id)
    const remaining = refresh()
    setActiveNoteId(remaining.length > 0 ? remaining[0].id : null)
  }

  function handleInsertTimestamp() {
    if (!getCurrentTime) return
    const seconds = getCurrentTime()
    const ts = formatTimestamp(seconds)
    const tag = `[${ts}]`

    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const before = content.slice(0, start)
      const after = content.slice(start)
      const newContent = `${before}${tag} ${after}`
      setContent(newContent)
      save(title, newContent)
      // Move cursor after the inserted tag
      setTimeout(() => {
        textarea.focus()
        const pos = start + tag.length + 1
        textarea.setSelectionRange(pos, pos)
      }, 0)
    } else {
      const newContent = content + `\n${tag} `
      setContent(newContent)
      save(title, newContent)
    }
  }

  function handleContentClick(e: React.MouseEvent<HTMLTextAreaElement>) {
    if (!onSeekTo) return
    const textarea = e.currentTarget
    const pos = textarea.selectionStart
    const text = textarea.value

    // Find if cursor is inside a [M:SS] or [MM:SS] timestamp
    const before = text.slice(0, pos + 6) // look a bit ahead
    const match = before.match(/\[(\d{1,3}):(\d{2})\]/)
    if (match) {
      const matchEnd = before.lastIndexOf(match[0]) + match[0].length
      const matchStart = matchEnd - match[0].length
      if (pos >= matchStart && pos <= matchEnd) {
        const mins = parseInt(match[1])
        const secs = parseInt(match[2])
        onSeekTo(mins * 60 + secs)
      }
    }
  }

  // Editor view
  if (activeNote) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1 p-2 border-b">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setActiveNoteId(null)}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              save(e.target.value, content)
            }}
            placeholder="Note title..."
            className="h-7 text-sm border-none shadow-none focus-visible:ring-0 px-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-destructive"
            onClick={() => handleDelete(activeNote.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {getCurrentTime && (
          <div className="px-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 h-7 text-xs"
              onClick={handleInsertTimestamp}
            >
              <Clock className="h-3 w-3" />
              Insert timestamp
            </Button>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            save(title, e.target.value)
          }}
          onClick={handleContentClick}
          placeholder="Start writing... Click [M:SS] timestamps to jump back"
          className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 rounded-none p-3 text-sm leading-relaxed"
        />
        <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground">
          Auto-saved &middot; Click [timestamps] to jump &middot; Also visible in Notes page
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button onClick={handleCreate} className="w-full gap-2" size="sm">
          <PlusCircle className="h-3.5 w-3.5" />
          New Note
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notes for this playlist yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to capture your learning.</p>
          </div>
        ) : (
          <div className="p-1">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className="p-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <p className="text-sm font-medium truncate">{note.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {note.content.slice(0, 60) || "Empty note"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
