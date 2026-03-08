"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

type Role = "student" | "professor"

export default function SignInPage() {
  const router = useRouter()
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true"
  const [role, setRole] = useState<Role>("student")
  const [roleId, setRoleId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      redirect: false,
      callbackUrl: "/homepage",
      role,
      roleId,
      email,
      password,
    })

    setLoading(false)
    if (!result?.ok) {
      setError("Invalid login credentials.")
      return
    }

    router.push("/homepage")
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
        <h1>Log in with your ID</h1>
        <p>Choose your role and enter your ID plus email and password.</p>

        <form className="auth-ui-form" onSubmit={onSubmit} autoComplete="on">
          {/* Autofill catcher to prevent password managers from filling role ID with email */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <input
            type="password"
            name="current-password"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <div className="auth-ui-role">
            <label>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
              />
              Student ID
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="professor"
                checked={role === "professor"}
                onChange={() => setRole("professor")}
              />
              Professor ID
            </label>
          </div>

          <label>
            {role === "student" ? "Student ID" : "Professor ID"}
            <input
              type="text"
              id="role-id"
              name="roleId"
              placeholder={role === "student" ? "MBC2025-00996" : "PROF-10021"}
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="********"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="auth-ui-error">{error}</p> : null}

          <button type="submit" className="auth-ui-primary" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>

          <button
            type="button"
            className="auth-ui-google"
            disabled={!googleEnabled}
            onClick={() => signIn("google", { callbackUrl: "/homepage" })}
          >
            <svg className="auth-ui-google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21.805 10.023h-9.18v3.955h5.264c-.227 1.273-.955 2.353-2.036 3.08v2.55h3.296c1.93-1.777 3.046-4.395 3.046-7.314 0-.758-.068-1.482-.19-2.27z"
                fill="#4285F4"
              />
              <path
                d="M12.625 22c2.758 0 5.073-.915 6.764-2.47l-3.296-2.55c-.914.614-2.08.977-3.468.977-2.666 0-4.923-1.8-5.73-4.214H3.488v2.63A10.214 10.214 0 0 0 12.625 22z"
                fill="#34A853"
              />
              <path
                d="M6.895 13.743a6.164 6.164 0 0 1-.321-1.953c0-.679.115-1.335.321-1.953V7.207H3.488A10.214 10.214 0 0 0 2.412 11.79c0 1.648.395 3.206 1.076 4.583l3.407-2.63z"
                fill="#FBBC05"
              />
              <path
                d="M12.625 5.623c1.5 0 2.846.516 3.906 1.528l2.93-2.93C17.693 2.572 15.377 1.58 12.625 1.58A10.214 10.214 0 0 0 3.488 7.207l3.407 2.63c.807-2.414 3.064-4.214 5.73-4.214z"
                fill="#EA4335"
              />
            </svg>
            {googleEnabled ? "Continue with Google" : "Google login not available"}
          </button>
        </form>

        <div className="auth-ui-footer">
          Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
        </div>
      </section>
    </main>
  )
}
