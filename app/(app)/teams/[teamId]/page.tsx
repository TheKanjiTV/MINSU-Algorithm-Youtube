"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlaylistQuiz } from "@/components/playlist-quiz"

type TeamQuestion = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type TeamItem = {
  id: string
  name: string
  playlistId?: string
  playlistTitle?: string
  quizMode: "generated" | "manual"
  manualQuestions: TeamQuestion[]
}

type PlaylistData = {
  id: string
  title: string
  videos: Array<{ id: string; title: string }>
}

export default function TeamAssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const teamId = params.teamId as string
  const [team, setTeam] = useState<TeamItem | null>(null)
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [manualAnswers, setManualAnswers] = useState<Record<string, number>>({})
  const [submittedManual, setSubmittedManual] = useState(false)
  const [showGeneratedQuiz, setShowGeneratedQuiz] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/teams/${teamId}/assessment`, { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error || "Failed to load team.")
        if (!mounted) return
        setTeam(data.team || null)

        const playlistId = data.team?.playlistId
        if (playlistId) {
          const playlistResponse = await fetch(`/api/course-playlists?id=${encodeURIComponent(playlistId)}`, {
            cache: "no-store",
          })
          const playlistData = await playlistResponse.json()
          if (playlistResponse.ok && mounted) {
            const found = Array.isArray(playlistData.playlists) ? playlistData.playlists[0] : null
            if (found) {
              setPlaylist({
                id: found.id,
                title: found.title,
                videos: Array.isArray(found.videos)
                  ? found.videos.map((video: { id: string; title: string }) => ({
                      id: video.id,
                      title: video.title,
                    }))
                  : [],
              })
            }
          }
        }
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load team.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [teamId])

  const manualScore = useMemo(() => {
    if (!submittedManual || !team) return 0
    return team.manualQuestions.reduce((sum, question) => {
      return manualAnswers[question.id] === question.answerIndex ? sum + 1 : sum
    }, 0)
  }, [manualAnswers, submittedManual, team])

  async function submitManualQuiz() {
    if (!team || !playlist) return
    setSubmittedManual(true)
    const totalQuestions = team.manualQuestions.length
    const score = team.manualQuestions.reduce((sum, question) => {
      return manualAnswers[question.id] === question.answerIndex ? sum + 1 : sum
    }, 0)
    if (totalQuestions <= 0) return
    await fetch("/api/quiz/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        score,
        totalQuestions,
        teamId: team.id,
      }),
    }).catch(() => null)
  }

  if (loading) {
    return <div className="container px-4 py-6 text-sm text-muted-foreground">Loading team...</div>
  }

  if (error || !team) {
    return <div className="container px-4 py-6 text-sm text-destructive">{error || "Team not found."}</div>
  }

  const isProfessor = user?.role === "professor"

  return (
    <div className="container px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {isProfessor ? "Professor team view" : "Student assessment view"}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!team.playlistId ? (
            <p className="text-sm text-muted-foreground">Professor has not assigned a playlist yet.</p>
          ) : null}

          {team.playlistId && playlist ? (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">{playlist.title}</p>
              <p className="text-xs text-muted-foreground">{playlist.videos.length} videos</p>
              <Link href={`/watch/${playlist.id}?teamId=${encodeURIComponent(team.id)}`}>
                <Button size="sm">Play Playlist</Button>
              </Link>
            </div>
          ) : null}

          {isProfessor ? (
            <p className="text-sm text-muted-foreground">
              Configure playlist and quiz mode from dashboard under Professor Teams.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {team.playlistId && playlist && team.quizMode === "generated" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Generated Quiz {isProfessor ? "(Preview)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowGeneratedQuiz(true)}>
              {isProfessor ? "Open Quiz Preview" : "Start Quiz"}
            </Button>
            <PlaylistQuiz
              playlistId={playlist.id}
              playlistTitle={playlist.title}
              videos={playlist.videos}
              visible={showGeneratedQuiz}
              onVisibilityChange={setShowGeneratedQuiz}
              teamId={team.id}
              readOnly={isProfessor}
            />
          </CardContent>
        </Card>
      ) : null}

      {team.playlistId && playlist && team.quizMode === "manual" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Professor Quiz {isProfessor ? "(Preview)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.manualQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Professor has not added manual quiz questions yet.</p>
            ) : (
              <>
                {team.manualQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium">
                      {index + 1}. {question.question}
                    </p>
                    <div className="grid gap-2">
                      {question.options.map((option, optionIndex) => {
                        const selected = manualAnswers[question.id] === optionIndex
                        const isCorrect = submittedManual && optionIndex === question.answerIndex
                        return (
                          <button
                            key={`${question.id}-${optionIndex}`}
                            type="button"
                            disabled={submittedManual || isProfessor}
                            className={[
                              "rounded-md border px-3 py-2 text-left text-sm",
                              selected ? "border-primary bg-accent" : "",
                              isCorrect ? "border-emerald-500 bg-emerald-50" : "",
                            ].join(" ")}
                            onClick={() =>
                              isProfessor
                                ? null
                                : setManualAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))
                            }
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {submittedManual ? (
                      <p className="text-xs text-muted-foreground">{question.explanation}</p>
                    ) : null}
                  </div>
                ))}
                {!submittedManual && !isProfessor ? (
                  <Button
                    onClick={submitManualQuiz}
                    disabled={Object.keys(manualAnswers).length < team.manualQuestions.length}
                  >
                    Submit Quiz
                  </Button>
                ) : null}
                {isProfessor ? (
                  <p className="text-xs text-muted-foreground">
                    Preview mode: You can view this team quiz but cannot submit answers.
                  </p>
                ) : (
                  submittedManual ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Score: {manualScore}/{team.manualQuestions.length}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const date = new Date().toISOString().slice(0, 10)
                          router.push(
                            `/certificate?playlistId=${encodeURIComponent(
                              playlist.id
                            )}&course=${encodeURIComponent(playlist.title)}&date=${encodeURIComponent(date)}`
                          )
                        }}
                      >
                        Certificate of Completion
                      </Button>
                    </div>
                  ) : null
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
