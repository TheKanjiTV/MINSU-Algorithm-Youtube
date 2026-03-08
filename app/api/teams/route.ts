import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { createTeam, listTeamsByProfessor, listTeamsByStudent } from "@/lib/teams"

type CreateBody = {
  name?: string
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role === "professor") {
    const teams = await listTeamsByProfessor(user.id)
    return NextResponse.json({ teams })
  }

  const teams = await listTeamsByStudent(user.id)
  return NextResponse.json({ teams })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "professor") {
    return NextResponse.json({ error: "Only professors can create teams." }, { status: 403 })
  }

  let body: CreateBody = {}
  try {
    body = (await request.json()) as CreateBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 })
  }

  const team = await createTeam({
    name,
    professorId: user.id,
    professorName: user.name || user.roleId || "Professor",
  })
  return NextResponse.json({ ok: true, team })
}

