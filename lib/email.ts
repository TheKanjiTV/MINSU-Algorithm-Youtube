type PasswordResetEmailInput = {
  to: string
  name?: string
  code: string
}

export async function sendPasswordResetCodeEmail(input: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.")
  }

  const safeName = input.name?.trim() || "User"
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Password Reset Code</h2>
      <p>Hello ${safeName},</p>
      <p>Use this code to reset your YT-Learn-MINSU password:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${input.code}</p>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Your password reset code",
      html,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    if (response.status === 403 && /domain is not verified/i.test(text)) {
      throw new Error("Email sender domain is not verified in Resend. Update RESEND_FROM_EMAIL to a verified sender.")
    }
    throw new Error(`Failed to send reset email (HTTP ${response.status}).`)
  }
}
