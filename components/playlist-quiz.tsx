"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type PlaylistQuizProps = {
  playlistId: string
  playlistTitle: string
  videos: Array<{ id: string; title: string }>
  visible: boolean
  onQuizSubmitted?: () => void
  onVisibilityChange?: (open: boolean) => void
  teamId?: string
  readOnly?: boolean
}

const CERT_TEMPLATE_SRC = "/cert/certificate-template.png"
const CERT_WIDTH = 3508
const CERT_HEIGHT = 2480
const QUIZ_FETCH_TIMEOUT_MS = 3000
const DEFAULT_LAYOUT = {
  nameX: 0.12,
  nameY: 0.49,
  nameSize: 0.048,
  courseX: 0.11,
  courseY: 0.647,
  courseSize: 0.017,
}

const FIXED_DATE_LAYOUT = {
  x: 0.54, // 54
  y: 0.643, // 643
  size: 0.015, // 15
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function cleanTitle(title: string) {
  return title
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractMainTopic(title: string): string {
  const cleaned = cleanTitle(title)
  const chunks = cleaned
    .split(/[-|:]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (chunks.length > 1) {
    return chunks[0].length >= chunks[1].length ? chunks[0] : chunks[1]
  }
  return cleaned || "Main topic"
}

function buildLocalQuiz(videos: Array<{ id: string; title: string }>): QuizQuestion[] {
  const pool = videos
    .map((video) => ({
      id: video.id,
      title: cleanTitle(video.title),
      topic: extractMainTopic(video.title),
    }))
    .filter((video) => video.id && video.title)
  if (pool.length < 2) return []

  return pool.map((video, index) => {
    const distractors = shuffle(pool.filter((entry) => entry.id !== video.id).map((entry) => entry.topic)).slice(0, 3)
    const options = shuffle(Array.from(new Set([video.topic, ...distractors]))).slice(0, 4)
    const answerIndex = Math.max(0, options.findIndex((option) => option === video.topic))
    const pattern = index % 4
    let question = `In video ${index + 1}, what is the main topic?`
    let explanation = `Video ${index + 1} is "${video.title}", which focuses on "${video.topic}".`

    if (pattern === 1) {
      question = `Which title best matches video ${index + 1}?`
      explanation = `The best matching title for video ${index + 1} is "${video.title}".`
    } else if (pattern === 2) {
      question = `Video ${index + 1} in this playlist focuses on which concept?`
      explanation = `Video ${index + 1} focuses on "${video.topic}" from "${video.title}".`
    } else if (pattern === 3) {
      question = `What is the likely lesson focus of playlist video ${index + 1}?`
      explanation = `Playlist video ${index + 1} highlights "${video.topic}".`
    }

    return {
      id: `${video.id}-fallback-${index + 1}`,
      question,
      options,
      answerIndex,
      explanation,
    }
  })
}

export function PlaylistQuiz({
  playlistId,
  playlistTitle,
  videos,
  visible,
  onQuizSubmitted,
  onVisibilityChange,
  teamId,
  readOnly = false,
}: PlaylistQuizProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStartedAt, setLoadingStartedAt] = useState(0)
  const [loadingElapsedSeconds, setLoadingElapsedSeconds] = useState(0)
  const [generatedInMs, setGeneratedInMs] = useState<number | null>(null)
  const [generationNotice, setGenerationNotice] = useState("")
  const [error, setError] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [savedResult, setSavedResult] = useState(false)
  const [quizSaveNotice, setQuizSaveNotice] = useState("")

  const [certificateOpen, setCertificateOpen] = useState(false)
  const [certificateName, setCertificateName] = useState("")
  const [certificateCourse, setCertificateCourse] = useState("")
  const [certificateDate, setCertificateDate] = useState(getTodayIsoDate())
  const [certificateStatus, setCertificateStatus] = useState("")
  const [isSubmittingCertificate, setIsSubmittingCertificate] = useState(false)
  const [isCertificateLocked, setIsCertificateLocked] = useState(false)
  const [hasQuizCompletion, setHasQuizCompletion] = useState(false)
  const [certificateLoadError, setCertificateLoadError] = useState("")
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)

  useEffect(() => {
    if (!loading || !loadingStartedAt) return
    const timer = setInterval(() => {
      setLoadingElapsedSeconds(Math.max(0, Math.floor((Date.now() - loadingStartedAt) / 1000)))
    }, 250)
    return () => clearInterval(timer)
  }, [loading, loadingStartedAt])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!visible) return
    if (questions.length > 0 || loading) return

    let mounted = true
    const loadQuiz = async () => {
      const local = buildLocalQuiz(videos)
      if (local.length > 0) {
        setQuestions(local)
        setGeneratedInMs(0)
        setGenerationNotice("Loaded instant quiz from playlist video topics.")
      } else {
        setLoading(true)
        setLoadingStartedAt(Date.now())
        setLoadingElapsedSeconds(0)
      }
      if (local.length === 0) {
        setGeneratedInMs(null)
      }
      setGenerationNotice(local.length > 0 ? "Loaded instant quiz from playlist video topics." : "")
      setError("")
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), QUIZ_FETCH_TIMEOUT_MS)
        const response = await fetch("/api/quiz/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            playlistId,
            videos: videos.map((video) => ({ id: video.id, title: video.title })),
            preview: readOnly,
          }),
        })
        clearTimeout(timeout)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || "Failed to generate quiz.")
        }
        if (!mounted) return
        const fromServer = Array.isArray(data.questions) ? data.questions : []
        if (fromServer.length > 0) {
          setQuestions(fromServer)
        }
        setGeneratedInMs(typeof data.generatedInMs === "number" ? data.generatedInMs : null)
      } catch (err) {
        if (!mounted) return
        const isAbort = err instanceof Error && err.name === "AbortError"
        if (isAbort) {
          if (local.length === 0) {
            setError("Quiz service timed out.")
          } else {
            setGeneratedInMs(QUIZ_FETCH_TIMEOUT_MS)
            setGenerationNotice("Using instant local quiz. Server refresh timed out.")
          }
        } else {
          if (local.length === 0) {
            setError(err instanceof Error ? err.message : "Failed to generate quiz.")
          } else {
            setGenerationNotice("Using instant local quiz. Server refresh failed.")
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadQuiz()
    return () => {
      mounted = false
    }
  }, [loading, playlistId, questions.length, readOnly, videos, visible])

  const score = useMemo(() => {
    if (!submitted || questions.length === 0) return 0
    return questions.reduce((sum, question) => {
      return answers[question.id] === question.answerIndex ? sum + 1 : sum
    }, 0)
  }, [answers, questions, submitted])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setCertificateLoadError("")
      drawCertificate()
    }
    img.onerror = () => {
      setCertificateLoadError("Missing file: /cert/certificate-template.png")
    }
    img.src = CERT_TEMPLATE_SRC
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    drawCertificate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateName, certificateCourse, certificateDate, certificateLoadError, certificateOpen, layout])

  useEffect(() => {
    if (!certificateOpen) return
    let cancelled = false
    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/certificates?playlistId=${encodeURIComponent(playlistId)}`, {
          cache: "no-store",
        })
        const data = await response.json()
        if (!response.ok || cancelled) return

        setHasQuizCompletion(Boolean(data.hasQuizCompletion))
        if (data.certificate) {
          setIsCertificateLocked(true)
          setCertificateName(data.certificate.recipientName || "")
          setCertificateCourse(data.certificate.course || playlistTitle || "")
          setCertificateDate(data.certificate.issuedDate || getTodayIsoDate())
          setCertificateStatus("Certificate already generated for this playlist.")
        } else {
          setIsCertificateLocked(false)
          setCertificateCourse((previous) => previous || playlistTitle || "")
          setCertificateDate(getTodayIsoDate())
          setCertificateStatus("")
        }
      } catch {
        if (!cancelled) {
          setCertificateStatus("Unable to validate certificate status right now.")
        }
      }
    }
    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [certificateOpen, playlistId])

  function drawCertificate() {
    if (certificateLoadError) return
    const canvas = canvasRef.current
    const template = imageRef.current
    if (!canvas || !template) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CERT_WIDTH, CERT_HEIGHT)
    ctx.drawImage(template, 0, 0, CERT_WIDTH, CERT_HEIGHT)

    // User-adjustable text positions/sizes for print fine tuning.
    const nameX = CERT_WIDTH * layout.nameX
    const nameY = CERT_HEIGHT * layout.nameY
    const courseX = CERT_WIDTH * layout.courseX
    const courseY = CERT_HEIGHT * layout.courseY
    const dateX = CERT_WIDTH * FIXED_DATE_LAYOUT.x
    const dateY = CERT_HEIGHT * FIXED_DATE_LAYOUT.y

    ctx.fillStyle = "#111111"
    ctx.textBaseline = "middle"

    ctx.font = `${Math.round(CERT_WIDTH * layout.nameSize)}px Arial`
    ctx.textAlign = "left"
    ctx.fillText(certificateName || "Your Name", nameX, nameY)

    const courseLabel = certificateCourse || "Course Name"
    const dateLabel = certificateDate || "YYYY-MM-DD"

    ctx.font = `${Math.round(CERT_WIDTH * layout.courseSize)}px Arial`
    ctx.textAlign = "left"
    ctx.fillText(courseLabel, courseX, courseY)
    ctx.font = `${Math.round(CERT_WIDTH * FIXED_DATE_LAYOUT.size)}px Arial`
    ctx.fillText(dateLabel, dateX, dateY)
  }

  async function submitQuiz() {
    if (readOnly) return
    setSubmitted(true)
    onQuizSubmitted?.()
    const total = questions.length
    const computedScore = questions.reduce((sum, question) => {
      return answers[question.id] === question.answerIndex ? sum + 1 : sum
    }, 0)
    if (!savedResult && total > 0) {
      try {
        const response = await fetch("/api/quiz/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playlistId,
            playlistTitle,
            score: computedScore,
            totalQuestions: total,
            teamId,
          }),
        })
        const data = await response.json()
        if (response.ok) {
          setQuizSaveNotice(
            data?.created
              ? "Quiz saved. Score is now visible in Dashboard and Insights."
              : "Quiz already saved before. Existing score is shown in Dashboard and Insights."
          )
        }
        setSavedResult(true)
        setHasQuizCompletion(true)
      } catch {
        // keep UI functional even if save fails
      }
    }
    setCertificateOpen(true)
  }

  async function submitCertificate() {
    if (!certificateName.trim() || !certificateCourse.trim() || !certificateDate.trim()) {
      setCertificateStatus("Please enter Name, Course, and Date.")
      return
    }
    if (!hasQuizCompletion) {
      setCertificateStatus("Complete and submit the quiz first.")
      return
    }
    if (isCertificateLocked) {
      setCertificateStatus("Certificate already generated for this playlist.")
      return
    }

    setIsSubmittingCertificate(true)
    setCertificateStatus("")
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          course: certificateCourse.trim(),
          recipientName: certificateName.trim(),
          issuedDate: certificateDate.trim(),
        }),
      })
      const data = await response.json()
      if (response.status === 409) {
        setIsCertificateLocked(true)
        setCertificateStatus(data?.error || "Certificate already generated for this playlist.")
        return
      }
      if (!response.ok) {
        setCertificateStatus(data?.error || "Failed to submit certificate.")
        return
      }
      setIsCertificateLocked(true)
      setCertificateStatus("Certificate submitted. You can download PNG or save as PDF.")
    } catch {
      setCertificateStatus("Failed to submit certificate.")
    } finally {
      setIsSubmittingCertificate(false)
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const fileBase = sanitizeFileName(certificateName || "certificate")
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${fileBase || "certificate"}-certificate.png`
    link.click()
  }

  function saveAsPdf() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const printWindow = window.open("", "_blank", "width=1200,height=900")
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Certificate PDF</title></head>
        <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:#fff;">
          <img src="${dataUrl}" style="width:100%;height:auto;max-width:1400px;" />
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const loadingStage = useMemo(() => {
    if (!loading) return ""
    if (loadingElapsedSeconds < 2) return "Step 1/2: Summarizing video titles..."
    return "Step 2/2: Building topic questions..."
  }, [loading, loadingElapsedSeconds])

  return (
    <>
      <Dialog open={visible} onOpenChange={onVisibilityChange}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Playlist Quiz</DialogTitle>
            <DialogDescription>
              Fast quiz based on per-video main topics and title summaries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generating quiz... {loadingElapsedSeconds}s
                </p>
                <p className="text-xs text-muted-foreground">{loadingStage}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(92, 20 + loadingElapsedSeconds * 12)}%` }}
                  />
                </div>
              </div>
            ) : null}
            {!loading && generatedInMs !== null ? (
              <p className="text-xs text-muted-foreground">
                Generated in {generatedInMs} ms
              </p>
            ) : null}
            {generationNotice ? <p className="text-xs text-amber-700">{generationNotice}</p> : null}
            {quizSaveNotice ? <p className="text-xs text-emerald-700">{quizSaveNotice}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {!loading && !error && questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz questions available for this playlist yet.</p>
            ) : null}

            {!loading &&
              questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    {index + 1}. {question.question}
                  </p>
                  <div className="grid gap-2">
                    {question.options.map((option, optionIndex) => {
                      const selected = answers[question.id] === optionIndex
                      const isCorrect = submitted && optionIndex === question.answerIndex
                      const isWrongSelected = submitted && selected && optionIndex !== question.answerIndex
                      return (
                        <button
                          key={`${question.id}-${optionIndex}`}
                          type="button"
                          disabled={submitted || readOnly}
                          className={[
                            "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                            selected ? "border-primary bg-accent" : "border-border",
                            isCorrect ? "border-emerald-500 bg-emerald-50" : "",
                            isWrongSelected ? "border-red-500 bg-red-50" : "",
                          ].join(" ")}
                          onClick={() => {
                            if (readOnly) return
                            setAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))
                          }}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  {submitted ? <p className="text-xs text-muted-foreground">{question.explanation}</p> : null}
                </div>
              ))}
          </div>

          <DialogFooter>
            {readOnly ? (
              <p className="text-xs text-muted-foreground w-full text-left">
                Preview mode: You can view the quiz but cannot answer in this team.
              </p>
            ) : null}

            {!loading && questions.length > 0 && !submitted && !readOnly ? (
              <Button
                type="button"
                onClick={submitQuiz}
                disabled={Object.keys(answers).length < questions.length}
              >
                Submit Quiz
              </Button>
            ) : null}

            {submitted && !readOnly ? (
              <div className="w-full flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Score: {score}/{questions.length}
                </p>
                <Button type="button" variant="outline" onClick={() => setCertificateOpen(true)}>
                  Open Certificate
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate of Completion</DialogTitle>
            <DialogDescription>Enter your name, submit once, then download PNG or save as PDF.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={certificateName}
                  onChange={(event) => setCertificateName(event.target.value)}
                  disabled={isCertificateLocked}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Course</label>
                <Input
                  value={certificateCourse}
                  onChange={(event) => setCertificateCourse(event.target.value)}
                  disabled={isCertificateLocked}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <div className="h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
                  {certificateDate}
                </div>
              </div>

              <Button type="button" onClick={submitCertificate} disabled={isSubmittingCertificate}>
                {isSubmittingCertificate ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadPng}
                disabled={
                  !!certificateLoadError ||
                  !certificateName.trim() ||
                  !certificateCourse.trim() ||
                  !certificateDate.trim()
                }
              >
                Download PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveAsPdf}
                disabled={
                  !!certificateLoadError ||
                  !certificateName.trim() ||
                  !certificateCourse.trim() ||
                  !certificateDate.trim()
                }
              >
                Save as PDF
              </Button>

              {!hasQuizCompletion ? (
                <p className="text-xs text-amber-700">Quiz completion not detected for this playlist yet.</p>
              ) : null}
              {certificateStatus ? <p className="text-xs text-muted-foreground">{certificateStatus}</p> : null}
              {certificateLoadError ? <p className="text-xs text-destructive">{certificateLoadError}</p> : null}

              <div className="space-y-2 rounded-md border p-2">
                <p className="text-xs font-medium">Fine Tune</p>
                <p className="text-[11px] text-muted-foreground">Move and resize text before download.</p>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Name X</span><span>{Math.round(layout.nameX * 100)}</span></div>
                  <input className="w-full" type="range" min="5" max="60" step="1" value={Math.round(layout.nameX * 100)} onChange={(event) => setLayout((previous) => ({ ...previous, nameX: Number(event.target.value) / 100 }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Name Y</span><span>{Math.round(layout.nameY * 1000)}</span></div>
                  <input className="w-full" type="range" min="350" max="600" step="1" value={Math.round(layout.nameY * 1000)} onChange={(event) => setLayout((previous) => ({ ...previous, nameY: Number(event.target.value) / 1000 }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Name Size</span><span>{Math.round(layout.nameSize * 1000)}</span></div>
                  <input className="w-full" type="range" min="30" max="70" step="1" value={Math.round(layout.nameSize * 1000)} onChange={(event) => setLayout((previous) => ({ ...previous, nameSize: Number(event.target.value) / 1000 }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Course X</span><span>{Math.round(layout.courseX * 100)}</span></div>
                  <input className="w-full" type="range" min="5" max="60" step="1" value={Math.round(layout.courseX * 100)} onChange={(event) => setLayout((previous) => ({ ...previous, courseX: Number(event.target.value) / 100 }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Course Y</span><span>{Math.round(layout.courseY * 1000)}</span></div>
                  <input className="w-full" type="range" min="550" max="780" step="1" value={Math.round(layout.courseY * 1000)} onChange={(event) => setLayout((previous) => ({ ...previous, courseY: Number(event.target.value) / 1000 }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]"><span>Course Size</span><span>{Math.round(layout.courseSize * 1000)}</span></div>
                  <input className="w-full" type="range" min="10" max="30" step="1" value={Math.round(layout.courseSize * 1000)} onChange={(event) => setLayout((previous) => ({ ...previous, courseSize: Number(event.target.value) / 1000 }))} />
                </div>
                <Button type="button" variant="outline" onClick={() => setLayout(DEFAULT_LAYOUT)}>
                  Reset Layout
                </Button>
              </div>
            </div>

            <div className="rounded-xl border p-2 bg-muted/20">
              <canvas
                ref={canvasRef}
                width={CERT_WIDTH}
                height={CERT_HEIGHT}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
