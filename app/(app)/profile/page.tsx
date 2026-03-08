"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getLibrary, getStats, getDailyCompletions } from "@/lib/storage"
import type { LibraryPlaylist, LearningStats, DailyCompletions } from "@/lib/types"
import { ContributionGraph } from "@/components/contribution-graph"
import { ProfessorQuizAnalytics } from "@/components/professor-quiz-analytics"
import { StudentQuizInsights } from "@/components/student-quiz-insights"
import { BookOpen, CheckCircle2, Flame, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user
  const [library, setLibrary] = useState<LibraryPlaylist[]>([])
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [dailyCompletions, setDailyCompletions] = useState<DailyCompletions>({})

  const refresh = useCallback(() => {
    setLibrary(getLibrary())
    setStats(getStats())
    setDailyCompletions(getDailyCompletions())
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = () => refresh()
    window.addEventListener("ytlearn:storage", onStorage as EventListener)
    return () => window.removeEventListener("ytlearn:storage", onStorage as EventListener)
  }, [refresh])

  if (!user) return null

  const initials = user.name?.charAt(0) || user.email?.charAt(0) || "U"
  const isProfessor = user.role === "professor"

  return (
    <div className="container px-4 py-6 max-w-4xl space-y-6">
      <section className="rounded-2xl border bg-gradient-to-r from-cyan-50 to-slate-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Profile</p>
        <h1 className="text-2xl font-bold mt-1">Learning Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress and activity across all playlists.</p>
      </section>

      {/* User info */}
      <Card className="overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{user.name || "User"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Member since N/A</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProfessor ? (
        <ProfessorQuizAnalytics />
      ) : (
        <>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
              <p className="text-xs text-muted-foreground">Playlists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.completedVideos}</p>
              <p className="text-xs text-muted-foreground">Videos Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contribution Graph */}
      <ContributionGraph data={dailyCompletions} />

      {/* All playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          {library.length === 0 ? (
            <p className="text-sm text-muted-foreground">No playlists yet.</p>
          ) : (
            <div className="space-y-3">
              {library.map((p) => {
                const progress =
                  p.totalVideos > 0
                    ? Math.round((p.completedVideoIds.length / p.totalVideos) * 100)
                    : 0
                return (
                  <Link key={p.id} href={`/watch/${p.id}`} className="block">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.channelTitle} &middot; {p.completedVideoIds.length}/{p.totalVideos} videos
                        </p>
                        <Progress value={progress} className="h-1 mt-1" />
                      </div>
                      <span className="text-sm font-medium shrink-0">{progress}%</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <div>
        <StudentQuizInsights />
      </div>
        </>
      )}
    </div>
  )
}
