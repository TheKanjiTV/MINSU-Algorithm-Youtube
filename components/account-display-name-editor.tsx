"use client"

import { FormEvent, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AccountDisplayNameEditorProps = {
  initialName: string
}

export function AccountDisplayNameEditor({ initialName }: AccountDisplayNameEditorProps) {
  const { update } = useSession()
  const [editing, setEditing] = useState(false)
  const [savedName, setSavedName] = useState(initialName)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setSavedName(initialName)
    if (!editing) {
      setName(initialName)
    }
  }, [editing, initialName])

  async function handleSave() {
    const nextName = name.trim()
    if (!nextName) {
      setError("Display name is required.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update display name.")
      }
      const savedName = data.name || nextName
      setSavedName(savedName)
      setName(savedName)
      setEditing(false)
      // Keep save fast: refresh session in background without blocking UI.
      void update({ name: savedName }).catch(() => null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update display name.")
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    void handleSave()
  }

  return (
    <div>
      <p className="text-muted-foreground">Display name</p>
      {!editing ? (
        <div className="mt-1 flex items-center gap-3">
          <p className="font-medium">{savedName || "User"}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      ) : (
        <form className="mt-2 space-y-2" onSubmit={handleSubmit}>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setName(savedName)
                setEditing(false)
                setError("")
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </form>
      )}
    </div>
  )
}
