"use client"

import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { getImportedCoursePlaylists, resetAllPlaylistProgress } from "@/lib/storage"
import type { LibraryPlaylist } from "@/lib/types"

type HomeUserPayload = {
  name: string
  email: string
  image: string
  role: string
  roleId: string
}

const COURSE_SYNC_COOLDOWN_MS = 4000
const COURSE_SYNC_TS_KEY = "qm_course_sync_last_at"
const LAST_USER_KEY = "ytlearn_last_session_user"

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // ignore storage write errors
  }
}

function safeGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function Homepage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return
    const sessionIdentity = user?.id || user?.email || ""
    if (sessionIdentity) {
      const lastIdentity = safeGet(localStorage, LAST_USER_KEY) || ""
      if (lastIdentity && lastIdentity !== sessionIdentity) {
        // Keep imported playlists but clear all done/continue state when switching accounts.
        resetAllPlaylistProgress()
      }
      safeSet(localStorage, LAST_USER_KEY, sessionIdentity)
    }

    const payload: HomeUserPayload = {
      name: user?.name || user?.roleId || user?.email?.split("@")[0] || "User",
      email: user?.email || "",
      image: user?.image || "",
      role: user?.role || "",
      roleId: user?.roleId || "",
    }
    safeSet(localStorage, "qm_home_user", JSON.stringify(payload))
  }, [status, user?.email, user?.id, user?.image, user?.name, user?.role, user?.roleId])

  useEffect(() => {
    let active = true
    const now = Date.now()
    const previous = Number(safeGet(sessionStorage, COURSE_SYNC_TS_KEY) || 0)
    if (previous > 0 && now - previous < COURSE_SYNC_COOLDOWN_MS) {
      return
    }

    const syncImported = async () => {
      const local = getImportedCoursePlaylists()
      let merged: LibraryPlaylist[] = local

      try {
        const response = await fetch("/api/course-playlists", { cache: "no-store" })
        const data = await response.json()
        const global = Array.isArray(data?.playlists) ? (data.playlists as LibraryPlaylist[]) : []
        const joined = [...local, ...global]
        const seen = new Set<string>()
        merged = joined.filter((playlist) => {
          if (!playlist?.id || seen.has(playlist.id)) return false
          seen.add(playlist.id)
          return true
        })
      } catch {
        // fallback to local playlists only
      }

      if (!active) return
      safeSet(localStorage, "qm_imported_playlists", JSON.stringify(merged))
      safeSet(sessionStorage, COURSE_SYNC_TS_KEY, String(Date.now()))
    }

    void syncImported()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const attachHandlers = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return
        const input = doc.getElementById("searchInput") as HTMLInputElement | null
        const button = doc.getElementById("searchBtn") as HTMLButtonElement | null
        if (!input || !button) return

        const navigateSearch = () => {
          const value = input.value.trim()
          if (!value) return
          window.location.href = `/search?q=${encodeURIComponent(value)}`
        }

        button.onclick = (event) => {
          event.preventDefault()
          navigateSearch()
        }
        input.onkeydown = (event) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          navigateSearch()
        }
      } catch {
        // keep homepage stable even if iframe script changes
      }
    }

    iframe.addEventListener("load", attachHandlers)
    return () => iframe.removeEventListener("load", attachHandlers)
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== "QM_SIGN_OUT") return
      signOut({ callbackUrl: "/sign-in" })
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <main style={{ height: "100vh", width: "100%", background: "#fff" }}>
      <iframe
        ref={iframeRef}
        src="/inserts/index.html"
        title="Homepage"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </main>
  )
}
