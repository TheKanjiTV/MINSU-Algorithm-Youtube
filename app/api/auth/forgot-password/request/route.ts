import { NextResponse } from "next/server"
import { createPasswordResetCode } from "@/lib/auth-store"
import { sendPasswordResetCodeEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const created = await createPasswordResetCode(email)

    // Keep the same response even when the email is not registered.
    if (!created) {
      return NextResponse.json({
        ok: true,
        message: "If the email exists, a reset code has been sent.",
      })
    }

    await sendPasswordResetCodeEmail({
      to: email,
      name: created.userName,
      code: created.code,
    })

    return NextResponse.json({
      ok: true,
      message: "If the email exists, a reset code has been sent.",
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Failed to request password reset."
    const message =
      /Invalid MongoDB URI|MONGODB_URI|ssl3_read_bytes|tlsv1 alert internal error/i.test(rawMessage)
        ? "Password reset service is temporarily unavailable due to database configuration."
        : rawMessage
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
