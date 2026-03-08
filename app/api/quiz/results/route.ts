import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import {
  createQuizAttemptOnce,
  getAllQuizAttempts,
  getQuizAttemptsByProfessor,
  getQuizAttemptsByUser,
} from "@/lib/quiz-results"
import { getTeamById } from "@/lib/teams"

type PostBody = {
  playlistId?: string
  playlistTitle?: string
  score?: number
  totalQuestions?: number
  teamId?: string
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get("scope")

  if (user.role === "professor") {
    if (scope === "teaching") {
      const attempts = await getQuizAttemptsByProfessor(user.id)
      return NextResponse.json({ attempts })
    }
    const attempts = await getAllQuizAttempts()
    return NextResponse.json({ attempts })
  }

  const attempts = await getQuizAttemptsByUser(user.id)
  return NextResponse.json({ attempts })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: PostBody = {}
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const playlistId = body.playlistId?.trim()
  const playlistTitle = body.playlistTitle?.trim()
  const totalQuestions = Number(body.totalQuestions || 0)
  const score = Number(body.score || 0)
  const teamId = body.teamId?.trim()
  if (!playlistId || !playlistTitle || totalQuestions <= 0 || score < 0) {
    return NextResponse.json(
      { error: "Missing/invalid fields: playlistId, playlistTitle, totalQuestions, score." },
      { status: 400 }
    )
  }
  if (user.role === "professor" && teamId) {
    return NextResponse.json(
      { error: "Professors can only preview team quizzes and cannot submit attempts for teams." },
      { status: 403 }
    )
  }

  let teamName: string | undefined
  let professorId: string | undefined
  if (teamId) {
    const team = await getTeamById(teamId)
    if (team) {
      teamName = team.name
      professorId = team.professorId
    }
  }

  const saved = await createQuizAttemptOnce({
    userId: user.id,
    userName: user.name || "Student",
    userEmail: user.email || "",
    playlistId,
    playlistTitle,
    teamId,
    teamName,
    professorId,
    totalQuestions,
    score,
  })

  return NextResponse.json({ ok: true, created: saved.created, attempt: saved.attempt })
}
