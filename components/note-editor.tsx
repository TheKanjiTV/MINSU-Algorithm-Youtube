"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { NoteFile } from "@/lib/types"
import { updateNote, deleteNote } from "@/lib/storage"

interface NoteEditorProps {
  note: NoteFile
  onDelete: () => void
  onUpdate: () => void
}

export function NoteEditor({ note, onDelete, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state when note changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id, note.title, note.content])

  const save = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(note.id, { title: newTitle, content: newContent })
        onUpdate()
      }, 500)
    },
    [note.id, onUpdate]
  )

  function handleTitleChange(value: string) {
    setTitle(value)
    save(value, content)
  }

  function handleContentChange(value: string) {
    setContent(value)
    save(title, value)
  }

  function handleDelete() {
    if (confirm("Delete this note?")) {
      deleteNote(note.id)
      onDelete()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b gap-2">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
        />
        <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing..."
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 rounded-none p-4 text-sm leading-relaxed"
      />
      <div className="px-4 py-2 border-t text-xs text-muted-foreground">
        Last saved: {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
