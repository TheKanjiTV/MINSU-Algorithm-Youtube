import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Youtube,
  MonitorPlay,
  CheckSquare,
  StickyNote,
  Play,
  Keyboard,
  Maximize2,
} from "lucide-react"

const FEATURES = [
  {
    icon: MonitorPlay,
    title: "Distraction-free",
    description: "No recommendations, no comments, no shorts. Just the video.",
  },
  {
    icon: CheckSquare,
    title: "Track progress",
    description: "Mark videos complete, see playlist progress bars, and hit completion milestones.",
  },
  {
    icon: StickyNote,
    title: "Take notes",
    description: "File-based notes system. Write, edit, and organize as you learn.",
  },
  {
    icon: Play,
    title: "Resume anywhere",
    description: "Auto-resume the last video you watched in every playlist.",
  },
  {
    icon: Keyboard,
    title: "Keyboard shortcuts",
    description: "N for next, P for previous, F for focus mode. Stay in the flow.",
  },
  {
    icon: Maximize2,
    title: "Focus mode",
    description: "Hide everything except the video. Full immersion, zero distractions.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          <span className="text-lg font-bold">YTLearn</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Learn from YouTube,
          <br />
          <span className="text-red-500">without distractions</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Save playlists, track your progress, take notes, and learn at your own pace — all in one clean, focused interface.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get Started Free
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl font-bold text-center mb-10">
          Everything you need to learn better
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6 space-y-3"
            >
              <feature.icon className="h-6 w-6 text-red-500" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to focus?</h2>
        <p className="text-muted-foreground mb-6">
          Start learning from YouTube playlists the right way.
        </p>
        <Link href="/sign-up">
          <Button size="lg">Get Started Free</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm border-t">
        <p>&copy; {new Date().getFullYear()} YTLearn. All rights reserved.</p>
      </footer>
    </div>
  )
}
