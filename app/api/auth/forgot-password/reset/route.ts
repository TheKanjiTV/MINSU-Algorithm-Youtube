import { NextResponse } from "next/server"
import { resetPasswordWithCode } from "@/lib/auth-store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      code?: string
      password?: string
    }

    const email = body.email?.trim()
    const code = body.code?.trim()
    const password = body.password

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code, and new password are required." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    const result = await resetPasswordWithCode({
      email,
      code,
      newPassword: password,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset password."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
