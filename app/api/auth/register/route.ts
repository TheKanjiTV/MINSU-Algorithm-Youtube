import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
      role?: "student" | "professor" | "user"
      roleId?: string
    }

    const name = body.name?.trim()
    const email = body.email?.trim()
    const password = body.password
    const roleId = body.roleId?.trim()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 })
    }

    const role = body.role || "user"
    if ((role === "student" || role === "professor") && !roleId) {
      return NextResponse.json({ error: "Role ID is required for student/professor accounts." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    await registerUser({
      name,
      email,
      password,
      role,
      roleId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register user."
    const status = message === "Email already registered" ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
