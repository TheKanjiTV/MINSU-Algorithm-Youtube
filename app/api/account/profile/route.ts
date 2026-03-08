import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { updateUserDisplayName } from "@/lib/auth-store"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id && !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { name?: string } = {}
  try {
    payload = (await request.json()) as { name?: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const name = payload.name?.trim() || ""
  if (!name) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 })
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Display name is too long." }, { status: 400 })
  }

  const updated = await updateUserDisplayName({
    userId: user.id,
    email: user.email || undefined,
    name,
  })
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true, name: updated.name })
}

