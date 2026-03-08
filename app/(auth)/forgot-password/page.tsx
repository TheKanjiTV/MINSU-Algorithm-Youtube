"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [requestDone, setRequestDone] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const response = await fetch("/api/auth/forgot-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
    setLoading(false)

    if (!response.ok) {
      setError(payload?.error || "Failed to send reset code.")
      return
    }

    setRequestDone(true)
    setMessage(payload?.message || "If the email exists, a reset code has been sent.")
  }

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const response = await fetch("/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, password }),
    })

    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    setLoading(false)

    if (!response.ok) {
      setError(payload?.error || "Unable to reset password.")
      return
    }

    setMessage("Password updated. You can now log in with your new password.")
    setCode("")
    setPassword("")
  }

  return (
    <main className="auth-ui-shell">
      <div className="auth-ui-backdrop" />
      <header className="auth-ui-top">
        <div className="auth-ui-top-inner">
          <Link href="/" className="auth-ui-brand" aria-label="Go to home">
            <img src="/R.png" alt="Logo" />
          </Link>
          <div className="auth-ui-actions" aria-label="Auth actions">
            <Link href="/sign-in" className="auth-ui-top-btn auth-ui-top-btn-ghost">
              Log in
            </Link>
            <Link href="/sign-up" className="auth-ui-top-btn auth-ui-top-btn-solid">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="auth-ui-card">
        <h1>Forgot password</h1>
        <p>Enter your email to receive a reset code, then set a new password.</p>

        <form className="auth-ui-form" onSubmit={requestCode}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-ui-primary" disabled={loading}>
            {loading ? "Sending code..." : "Send reset code"}
          </button>
        </form>

        {requestDone ? (
          <form className="auth-ui-form auth-ui-form-spaced" onSubmit={resetPassword}>
            <label>
              Verification code
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>

            <label>
              New password
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            <button type="submit" className="auth-ui-primary" disabled={loading}>
              {loading ? "Updating..." : "Reset password"}
            </button>
          </form>
        ) : null}

        {error ? <p className="auth-ui-error">{error}</p> : null}
        {message ? <p className="auth-ui-success">{message}</p> : null}

        <div className="auth-ui-footer">
          <Link href="/sign-in">Back to Login</Link>
        </div>
      </section>
    </main>
  )
}
