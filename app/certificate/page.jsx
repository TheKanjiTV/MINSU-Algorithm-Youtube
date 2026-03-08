"use client"

import { useEffect, useRef, useState } from "react"

const TEMPLATE_SRC = "/cert/certificate-template.png"
const WIDTH = 3508
const HEIGHT = 2480

function sanitizeFileName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CertificatePage() {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  const [playlistId, setPlaylistId] = useState("")
  const [name, setName] = useState("")
  const [course, setCourse] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [hasQuizCompletion, setHasQuizCompletion] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextPlaylistId = params.get("playlistId") || ""
    const nextCourse = params.get("course") || ""
    const nextDate = params.get("date") || new Date().toISOString().slice(0, 10)

    setPlaylistId(nextPlaylistId)
    if (nextCourse) setCourse(nextCourse)
    setDate(nextDate)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setLoadError("")
      drawCanvas()
    }
    img.onerror = () => {
      setLoadError("Missing file: /cert/certificate-template.png")
    }
    img.src = TEMPLATE_SRC
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!playlistId) return
    let cancelled = false
    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/certificates?playlistId=${encodeURIComponent(playlistId)}`)
        const data = await response.json()
        if (!response.ok || cancelled) return

        setHasQuizCompletion(Boolean(data.hasQuizCompletion))
        if (data.certificate) {
          setIsLocked(true)
          setName(data.certificate.recipientName || "")
          setCourse((previous) => previous || data.certificate.course || "")
          setDate(data.certificate.issuedDate || new Date().toISOString().slice(0, 10))
          setStatusMessage("Certificate already generated for this playlist.")
        }
      } catch {
        if (!cancelled) setStatusMessage("Unable to validate quiz/certificate status right now.")
      }
    }
    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [playlistId])

  useEffect(() => {
    drawCanvas()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, course, date, loadError])

  function drawCanvas() {
    if (loadError) return
    const canvas = canvasRef.current
    const template = imageRef.current
    if (!canvas || !template) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.drawImage(template, 0, 0, WIDTH, HEIGHT)

    const nameX = WIDTH * 0.5
    const nameY = HEIGHT * 0.47
    const courseX = WIDTH * 0.12
    const courseY = HEIGHT * 0.73
    const dateX = WIDTH * 0.62
    const dateY = HEIGHT * 0.73

    ctx.fillStyle = "#111111"
    ctx.textBaseline = "middle"

    ctx.font = `${Math.round(WIDTH * 0.055)}px Arial`
    ctx.textAlign = "center"
    ctx.fillText(name || "Your Name", nameX, nameY)

    ctx.font = `${Math.round(WIDTH * 0.014)}px Arial`
    ctx.textAlign = "left"
    ctx.fillText(course || "Course Name", courseX, courseY)
    ctx.fillText(date || "YYYY-MM-DD", dateX, dateY)
  }

  async function submitCertificate() {
    if (!playlistId || !name.trim() || !course.trim() || !date.trim()) {
      setStatusMessage("Please enter Name, Course, and Date.")
      return
    }
    if (!hasQuizCompletion) {
      setStatusMessage("Complete the playlist quiz first.")
      return
    }
    if (isLocked) {
      setStatusMessage("Certificate already generated for this playlist.")
      return
    }

    setIsSubmitting(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          recipientName: name.trim(),
          course: course.trim(),
          issuedDate: date.trim(),
        }),
      })
      const data = await response.json()
      if (response.status === 409) {
        setIsLocked(true)
        setStatusMessage(data?.error || "Certificate already generated for this playlist.")
        return
      }
      if (!response.ok) {
        setStatusMessage(data?.error || "Failed to submit certificate.")
        return
      }
      setIsLocked(true)
      setStatusMessage("Certificate submitted. You can now download it.")
    } catch {
      setStatusMessage("Failed to submit certificate.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const fileBase = sanitizeFileName(name || "certificate")
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${fileBase || "certificate"}-certificate.png`
    link.click()
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Certificate of Completion</h1>
        <p className="text-sm text-muted-foreground">A4 landscape certificate preview and export (3508 x 2480).</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-xl border p-4 space-y-3 h-fit">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Course</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isLocked}
            />
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={submitCertificate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            className="w-full rounded-md border px-3 py-2 text-sm"
            onClick={downloadPng}
            disabled={!!loadError || !name.trim() || !course.trim() || !date.trim()}
          >
            Download PNG
          </button>

          {!hasQuizCompletion ? (
            <p className="text-xs text-amber-700">Quiz completion not detected for this playlist yet.</p>
          ) : null}
          {statusMessage ? <p className="text-xs text-muted-foreground">{statusMessage}</p> : null}
        </div>

        <div className="rounded-xl border p-3 bg-muted/20">
          {loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : (
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          )}
        </div>
      </section>
    </main>
  )
}
