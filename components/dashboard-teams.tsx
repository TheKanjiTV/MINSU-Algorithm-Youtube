"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getLibrary } from "@/lib/storage"
import type { LibraryPlaylist } from "@/lib/types"

type ManualQuestion = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type TeamItem = {
  id: string
  name: string
  joinCode: string
  playlistId?: string
  playlistTitle?: string
  quizMode: "generated" | "manual"
  manualQuestions: ManualQuestion[]
}

function parseJoinCode(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const match = trimmed.match(/join=([A-Z0-9]+)/i)
  if (match?.[1]) return match[1].toUpperCase()
  return trimmed.toUpperCase()
}

export function ProfessorTeamsPanel() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [teamName, setTeamName] = useState("")
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [origin, setOrigin] = useState("")
  const [library, setLibrary] = useState<LibraryPlaylist[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [playlistId, setPlaylistId] = useState("")
  const [quizMode, setQuizMode] = useState<"generated" | "manual">("generated")
  const [manualRaw, setManualRaw] = useState("")
  const [savingAssessment, setSavingAssessment] = useState(false)

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [selectedTeamId, teams]
  )

  async function loadTeams() {
    const response = await fetch("/api/teams", { cache: "no-store" })
    const data = await response.json()
    setTeams(Array.isArray(data.teams) ? data.teams : [])
  }

  async function loadLibraryOptions() {
    const local = getLibrary()
    try {
      const response = await fetch("/api/course-playlists", { cache: "no-store" })
      const data = await response.json()
      const global = Array.isArray(data.playlists) ? (data.playlists as LibraryPlaylist[]) : []
      const merged = [...local, ...global]
      const seen = new Set<string>()
      setLibrary(
        merged.filter((playlist) => {
          if (!playlist?.id || seen.has(playlist.id)) return false
          seen.add(playlist.id)
          return true
        })
      )
    } catch {
      setLibrary(local)
    }
  }

  useEffect(() => {
    void loadTeams()
    void loadLibraryOptions()
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!selectedTeam) return
    setPlaylistId(selectedTeam.playlistId || "")
    setQuizMode(selectedTeam.quizMode)
    setManualRaw(
      selectedTeam.manualQuestions.length
        ? JSON.stringify(selectedTeam.manualQuestions, null, 2)
        : ""
    )
  }, [selectedTeam])

  async function createNewTeam() {
    const name = teamName.trim()
    if (!name) return
    setCreating(true)
    setMessage("")
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to create team.")
      setTeamName("")
      await loadTeams()
      setMessage("Team created.")
      if (data.team?.id) setSelectedTeamId(data.team.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create team.")
    } finally {
      setCreating(false)
    }
  }

  async function saveAssessment() {
    if (!selectedTeam) return
    setSavingAssessment(true)
    setMessage("")
    try {
      const picked = library.find((playlist) => playlist.id === playlistId)
      const manualQuestions =
        quizMode === "manual" && manualRaw.trim()
          ? (JSON.parse(manualRaw) as ManualQuestion[])
          : []
      const response = await fetch(`/api/teams/${selectedTeam.id}/assessment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: picked?.id || "",
          playlistTitle: picked?.title || "",
          quizMode,
          manualQuestions,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to save assessment.")
      await loadTeams()
      setMessage("Assessment saved.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save assessment.")
    } finally {
      setSavingAssessment(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Professor Teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Team name (ex: BSIT Section A)"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
            <Button onClick={createNewTeam} disabled={creating || !teamName.trim()}>
              {creating ? "Creating..." : "Create Team"}
            </Button>
          </div>
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

          <div className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams yet.</p>
            ) : (
              teams.map((team) => {
                const joinUrl = `${origin || ""}/dashboard?join=${team.joinCode}`
                return (
                  <div key={team.id} className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">Join code: {team.joinCode}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(joinUrl).catch(() => null)
                          setMessage("Join link copied.")
                        }}
                      >
                        Copy Join Link
                      </Button>
                      <Button
                        variant={selectedTeamId === team.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        Configure Assessment
                      </Button>
                      <Link href={`/teams/${team.id}`}>
                        <Button variant="ghost" size="sm">
                          Open Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTeam ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assessment Setup: {selectedTeam.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Playlist</p>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={playlistId}
                onChange={(event) => setPlaylistId(event.target.value)}
              >
                <option value="">Select playlist</option>
                {library.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Quiz Mode</p>
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="quizMode"
                    checked={quizMode === "generated"}
                    onChange={() => setQuizMode("generated")}
                  />
                  Generated from YouTube playlist
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="quizMode"
                    checked={quizMode === "manual"}
                    onChange={() => setQuizMode("manual")}
                  />
                  Professor custom quiz
                </label>
              </div>
            </div>

            {quizMode === "manual" ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Manual quiz JSON array (question, options[4], answerIndex, explanation)
                </p>
                <Textarea
                  value={manualRaw}
                  onChange={(event) => setManualRaw(event.target.value)}
                  className="min-h-32 font-mono text-xs"
                />
              </div>
            ) : null}

            <Button onClick={saveAssessment} disabled={savingAssessment}>
              {savingAssessment ? "Saving..." : "Save Assessment"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function StudentTeamsPanel() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [joinValue, setJoinValue] = useState("")
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState("")

  async function loadTeams() {
    const response = await fetch("/api/teams", { cache: "no-store" })
    const data = await response.json()
    setTeams(Array.isArray(data.teams) ? data.teams : [])
  }

  useEffect(() => {
    void loadTeams()
    const params = new URLSearchParams(window.location.search)
    const joinFromUrl = parseJoinCode(params.get("join") || "")
    if (joinFromUrl) {
      setJoinValue(joinFromUrl)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinFromUrl = parseJoinCode(params.get("join") || "")
    if (!joinFromUrl) return
    setJoinValue(joinFromUrl)
    void (async () => {
      try {
        const response = await fetch("/api/teams/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinCode: joinFromUrl }),
        })
        const data = await response.json()
        if (response.ok) {
          setMessage("Joined team from invite link.")
          await loadTeams()
        } else {
          setMessage(data?.error || "Unable to join team from link.")
        }
      } catch {
        setMessage("Unable to join team from link.")
      }
      params.delete("join")
      const next = params.toString()
      const target = `${window.location.pathname}${next ? `?${next}` : ""}`
      window.history.replaceState({}, "", target)
    })()
  }, [])

  async function joinTeamNow() {
    const joinCode = parseJoinCode(joinValue)
    if (!joinCode) return
    setJoining(true)
    setMessage("")
    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Unable to join team.")
      setJoinValue("")
      setMessage("Joined team.")
      await loadTeams()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to join team.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <Card className="border-slate-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">Join Groupchat / Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Paste team link or join code"
            value={joinValue}
            onChange={(event) => setJoinValue(event.target.value)}
            className="text-sm"
          />
          <Button onClick={joinTeamNow} disabled={joining || !joinValue.trim()}>
            {joining ? "Joining..." : "Join"}
          </Button>
        </div>
        {message ? <p className="text-xs text-slate-700">{message}</p> : null}

        <div className="space-y-2">
          {teams.length === 0 ? (
            <p className="text-sm text-slate-700">No joined teams yet.</p>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-slate-300 bg-white p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                  <p className="text-xs text-slate-700">
                    {team.playlistTitle ? `Assessment: ${team.playlistTitle}` : "No assessment yet"}
                  </p>
                </div>
                <Link href={`/teams/${team.id}`}>
                  <Button size="sm" className="font-semibold">Open Assessment</Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
