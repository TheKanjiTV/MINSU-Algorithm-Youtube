import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getTeamById, listTeamMembers, updateTeamAssessment } from "@/lib/teams"

type ManualQuestionBody = {
  question?: string
  options?: string[]
  answerIndex?: number
  explanation?: string
}

type AssessmentBody = {
  playlistId?: string
  playlistTitle?: string
  quizMode?: "generated" | "manual"
  manualQuestions?: ManualQuestionBody[]
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { teamId } = await context.params
  const team = await getTeamById(teamId)
  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 })
  }
  if (user.role === "professor" && team.professorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (user.role !== "professor") {
    const members = await listTeamMembers(team.id)
    const joined = members.some((member) => member.userId === user.id)
    if (!joined) {
      return NextResponse.json({ error: "Join this team first." }, { status: 403 })
    }
  }
  return NextResponse.json({ team })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "professor") {
    return NextResponse.json({ error: "Only professors can edit assessments." }, { status: 403 })
  }

  let body: AssessmentBody = {}
  try {
    body = (await request.json()) as AssessmentBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { teamId } = await context.params
  const quizMode = body.quizMode === "manual" ? "manual" : "generated"
  const manualQuestions =
    quizMode === "manual"
      ? (body.manualQuestions || [])
          .map((item) => ({
            id: crypto.randomUUID(),
            question: item.question?.trim() || "",
            options: Array.isArray(item.options)
              ? item.options.map((value) => value.trim()).filter(Boolean).slice(0, 4)
              : [],
            answerIndex: Number(item.answerIndex ?? 0),
            explanation: item.explanation?.trim() || "",
          }))
          .filter((item) => item.question && item.options.length >= 2 && item.answerIndex >= 0)
      : []

  const updated = await updateTeamAssessment({
    teamId,
    professorId: user.id,
    playlistId: body.playlistId,
    playlistTitle: body.playlistTitle,
    quizMode,
    manualQuestions,
  })

  if (!updated) {
    return NextResponse.json({ error: "Team not found or unauthorized." }, { status: 404 })
  }

  return NextResponse.json({ ok: true, team: updated })
}
