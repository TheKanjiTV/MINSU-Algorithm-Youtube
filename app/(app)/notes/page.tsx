"use client"

import { useEffect, useState } from "react"
import { NotesSidebar } from "@/components/notes-sidebar"
import { NoteEditor } from "@/components/note-editor"
import { EmptyState } from "@/components/empty-state"
import { getNotes, createNote } from "@/lib/storage"
import type { NoteFile } from "@/lib/types"
import { StickyNote, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteFile[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  function refresh() {
    const all = getNotes()
    setNotes(all)
    return all
  }

  useEffect(() => {
    const all = refresh()
    if (all.length > 0) {
      setActiveNoteId(all[0].id)
    }
  }, [])

  function handleCreate() {
    const note = createNote("Untitled Note")
    const all = refresh()
    setActiveNoteId(note.id)
  }

  function handleDelete() {
    const all = refresh()
    setActiveNoteId(all.length > 0 ? all[0].id : null)
  }

  function handleUpdate() {
    refresh()
  }

  const activeNote = notes.find((n) => n.id === activeNoteId)

  if (notes.length === 0) {
    return (
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Notes</h1>
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create your first note to start capturing your learning."
        >
          <Button onClick={handleCreate} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Note
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-64 lg:w-72 shrink-0 hidden sm:block">
        <NotesSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelect={setActiveNoteId}
          onCreate={handleCreate}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {activeNote ? (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a note to start editing
          </div>
        )}
      </div>

      {/* Mobile: floating create button */}
      <div className="sm:hidden fixed bottom-4 right-4">
        <Button onClick={handleCreate} size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
