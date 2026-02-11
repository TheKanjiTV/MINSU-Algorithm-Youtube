"use client"

import { useEffect } from "react"

interface ShortcutHandlers {
  onNext?: () => void
  onPrev?: () => void
  onToggleFocus?: () => void
}

export function useKeyboardShortcuts({ onNext, onPrev, onToggleFocus }: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault()
          onNext?.()
          break
        case "p":
          e.preventDefault()
          onPrev?.()
          break
        case "f":
          e.preventDefault()
          onToggleFocus?.()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onNext, onPrev, onToggleFocus])
}
