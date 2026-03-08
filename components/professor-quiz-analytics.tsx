"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type QuizAttempt = {
  id: string
  userId: string
  userName: string
  userEmail: string
  playlistId: string
  playlistTitle: string
  totalQuestions: number
  score: number
  createdAt: string
}

export function ProfessorQuizAnalytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await fetch("/api/quiz/results?scope=teaching", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error || "Failed to load analytics.")
        if (!mounted) return
        setAttempts(Array.isArray(data.attempts) ? data.attempts : [])
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load analytics.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => {
    const studentIds = new Set(attempts.map((attempt) => attempt.userId))
    const average =
      attempts.length === 0
        ? 0
        : Math.round(
            (attempts.reduce((sum, attempt) => sum + attempt.score / Math.max(1, attempt.totalQuestions), 0) /
              attempts.length) *
              100
          )
    return {
      students: studentIds.size,
      attempts: attempts.length,
      average,
    }
  }, [attempts])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Students Took Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.students}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.attempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.average}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading analytics...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error && attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
          ) : null}
          {!loading && !error && attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.slice(0, 50).map((attempt) => {
                const percent = Math.round((attempt.score / Math.max(1, attempt.totalQuestions)) * 100)
                return (
                  <div key={attempt.id} className="rounded-lg border p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{attempt.userName}</p>
                        <p className="text-xs text-muted-foreground">{attempt.userEmail}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        {attempt.score}/{attempt.totalQuestions} ({percent}%)
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{attempt.playlistTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
