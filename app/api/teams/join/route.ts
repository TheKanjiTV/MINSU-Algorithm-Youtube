import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { joinTeam } from "@/lib/teams"

type JoinBody = {
  joinCode?: string
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role === "professor") {
    return NextResponse.json({ error: "Professors cannot join student teams." }, { status: 403 })
  }

  let body: JoinBody = {}
  try {
    body = (await request.json()) as JoinBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const joinCode = body.joinCode?.trim()
  if (!joinCode) {
    return NextResponse.json({ error: "Join code is required." }, { status: 400 })
  }

  const result = await joinTeam({
    joinCode,
    userId: user.id,
    userName: user.name || user.roleId || "Student",
    userEmail: user.email || "",
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({ ok: true, team: result.team })
}

